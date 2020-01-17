const request = require('request');
const _ = require('lodash');

const compile = (template, data) => {
	let result = template.toString ? template.toString() : '';
	result = result.replace(/{.+?}/g, function (matcher) {
		var path = matcher.slice(1, -1).trim();
		return _.get(data, path, '');
	});
	return result;
}

class APIBus {
	constructor({ app, key }) {
		this.app = app;
		if (key) {
			this.key = key;
			let { key_id, user_id, consumer_key, consumer_secret, key_permissions } = key;
			this.oauth = {
				callback: app.app_host,
				consumer_key,
				consumer_secret,
			}
		}
	}

	buildLink() {
		let { wp_host, app_host, return_url, callback_url, app_name } = this.app;
		const url = `${wp_host}/wc-auth/v1/authorize?app_name=${app_name}&scope=read_write&user_id=1&return_url=${return_url}&callback_url=${callback_url}`;
		return url;
	}

	call(option, plus) {
		return new Promise((resolve, reject) => {
			let oauth = this.oauth;
			option.auth = oauth;

			let url_custom = _.cloneDeep(option.url);
			if (plus && plus.params) {
				url_custom = compile(url_custom, plus.params);
				delete plus.params;
			}
			let url = `${this.app.wp_host}/wp-json/wc/v1/${url_custom}`;

			for (let key in plus) {
				option[key] = plus[key];
			}
			let finalConfig = {
				method: option.method,
				url,
			}
			if (/^https/i.test(url)) {
				finalConfig.auth = {
					user: oauth.consumer_key,
					pass: oauth.consumer_secret,
				};
			} else {
				finalConfig.oauth = {
					callback: oauth.callback,
					consumer_key: oauth.consumer_key,
					consumer_secret: oauth.consumer_secret
				}
			}

			if (['post', 'put'].indexOf(option.method) != -1) {
				finalConfig.headers['Content-Type'] = 'application/json',
					finalConfig.body = option.body;
			}
			request(finalConfig, function (err, response, body) {
				if (err) { return reject(err); }
				console.log(`[CALL] [${String(finalConfig.method).toUpperCase()}] ${finalConfig.url} - ${response.statusCode}`)
				let data = JSON.parse(body);
				resolve(data);
			})
		});
	}
}

module.exports = APIBus;

const start = async ({ app }) => {
	// Port expressjs running
	const PORT = process.env.HOST || 5000;
	// Ngrok listen port 5000
	const app_host = 'https://93263033.ngrok.io';
	const pathHook = `${app_host}/webhook`;
	// Your woocommerce site
	const wp_host = 'http://localhost:8080/QH1901';

	const listWebhooks = [
		{ topic: 'customer.created', status: 'active', },
		{ topic: 'customer.updated', status: 'active', },
		{ topic: 'customer.deleted', status: 'active', },
		{ topic: 'order.created', status: 'active', },
		{ topic: 'order.updated', status: 'active', },
		{ topic: 'order.deleted', status: 'active', },
		{ topic: 'product.created', status: 'active', },
		{ topic: 'product.updated', status: 'active', },
		{ topic: 'product.deleted', status: 'active', },
	]

	let WOO = {};
	WOO.WEBHOOKS = {
		LIST: {
			method: `get`,
			url: `webhooks`
		},
		CREATE: {
			method: `post`,
			url: `webhooks`,
			body: {}
		},
		UPDATE: {
			method: `put`,
			url: `webhooks/{id}`,
			body: {}
		}
	}

	WOO.PRODUCTS = {
		LIST: {
			method: 'get',
			url: 'products'
		}
	}

	console.log(`${app_host}/build_link`);
	app.get('/build_link', (req, res) => {
		let API = new APIBus({ app: { wp_host, app_host, app_name: 'MYAPP', return_url: `${app_host}/return_url`, callback_url: `${app_host}/callback_url` } });
		let url = API.buildLink();
		if (!url) { return res.send({ error: true, message: 'Build link install failed.' }); }
		res.send({ error: false, url });
	})

	// return_url: 'return_url'
	app.get('/return_url', (req, res) => {
		if (req.query && req.query.success) {
			res.send({ error: false, message: 'Install App Success' });
		} else {
			res.send({ error: true, message: 'Install App Failed' });
		}
	})

	// callback_url: 'callback_url'
	app.post('/callback_url', async (req, res) => {
		let key = req.body;
		let API = new APIBus({ app: { wp_host, app_host }, key });
		let webhooks = await API.call(WOO.WEBHOOKS.LIST);
		for (let i = 0; i < listWebhooks.length; i++) {
			let webhook = listWebhooks[i];
			let found = webhooks.find(e => e.topic == webhook.topic);
			if (found) {
				API.call(WOO.WEBHOOKS.UPDATE, { params: { id: found.id }, body: JSON.stringify({ id: found.id, ...webhook, delivery_url: pathHook }) });
			} else {
				API.call(WOO.WEBHOOKS.CREATE, { body: JSON.stringify({ ...webhook, delivery_url: pathHook }) });
			}
		}
		res.send(req.body)
	})

	app.get('/products', async (req, res) => {
		try {
			let key = {
				"key_id": 35,
				"user_id": "1",
				"consumer_key": "ck_0f744950e64f020e7bfc394de00d56425b8cf2e1",
				"consumer_secret": "cs_1a857af82a5f37e3dce4c7b7bdce7d8717eb76f9",
				"key_permissions": "read_write"
			}
			let API = new APIBus({ app: { wp_host, app_host }, key });
			let products = await API.call(WOO.PRODUCTS.LIST);
			res.send({ error: false, data: products });
		} catch (error) {
			console.log(error);
			res.send({ error: true });
		}
	})

	// pathHook = `/webhook`;
	app.post('/webhook', (req, res) => {
		let topic = req.headers['x-wc-webhook-topic'];
		if (!topic) { return res.send({ topic: 'No topic!' }); }
		let data = req.body;
		switch (topic) {
			case 'customer.created':
				console.log(data);
				break;
			case 'customer.updated':
				console.log(data);
				break;
			case 'customer.deleted':
				console.log(data);
				break;
			case 'order.created':
				console.log(data);
				break;
			case 'order.updated':
				console.log(data);
				break;
			case 'order.deleted':
				console.log(data);
				break;
			case 'product.created':
				console.log(data);
				break;
			case 'product.updated':
				console.log(data);
				break;
			case 'product.deleted':
				console.log(data);
				break;
		}
		res.send({ topic })
	})

	app.listen(PORT)
}

const test = () => {
	const express = require('express');
	const bodyParser = require('body-parser');
	const app = express();
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	start({ app });
}
test();