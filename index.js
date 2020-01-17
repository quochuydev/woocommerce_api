const express = require('express');
const request = require('request');
const _ = require('lodash');
const bodyParser = require('body-parser');
const app = express();

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
		const url = `${wp_host}/wc-auth/v1/authorize?app_name=${app_name}&scope=read_write&user_id=1&return_url=${app_host}/${return_url}&callback_url=${app_host}/${callback_url}`;
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
				headers: {
				},
				method: option.method,
				url,
				oauth,
			}
			if (['post', 'put'].indexOf(option.method) != -1) {
				finalConfig.headers['Content-Type'] = 'application/json',
					finalConfig.body = option.body;
			}
			console.log(`[CALL] [${String(finalConfig.method).toUpperCase()}] ${finalConfig.url}`)
			request(finalConfig, function (e, r, body) {
				let data = JSON.parse(body);
				resolve(data);
			})
		});
	}
}

const start = async ({ app }) => {
	app.use(bodyParser.urlencoded({ extended: false }))
	app.use(bodyParser.json())
	const PORT = process.env.HOST || 5000;
	const app_host = 'https://2143d9ae.ngrok.io';
	const wp_host = 'http://localhost:8080/QH1901';
	const pathHook = `${app_host}/webhook`;

	const listWebhooks = [
		{
			topic: 'customer.created',
			status: 'active',
		},
		{
			topic: 'customer.updated',
			status: 'active',
		},
		{
			topic: 'customer.deleted',
			status: 'active',
		},
		{
			topic: 'order.created',
			status: 'active',
		},
		{
			topic: 'order.updated',
			status: 'active',
		},
		{
			topic: 'order.deleted',
			status: 'active',
		},
		{
			topic: 'product.created',
			status: 'active',
		},
		{
			topic: 'product.updated',
			status: 'active',
		},
		{
			topic: 'product.deleted',
			status: 'active',
		},
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

	console.log(`${app_host}/build_link`);
	app.get('/build_link', (req, res) => {
		let API = new APIBus({ app: { wp_host, app_host, app_name: 'MYAPP', return_url: 'return_url', callback_url: 'callback_url' } });
		let url = API.buildLink(); 
		if (url) {
			res.send({ error: false, url });
		} else {
			res.send({ error: true, message: 'Build link install failed.' });
		}
	})

	app.get('/return_url', (req, res) => {
		if (req.query && req.query.success) {
			res.send({ error: false, message: 'Cài app thành công' });
		} else {
			res.send({ error: true, message: 'Cài app không thành công' });
		}
	})

	app.post('/callback_url', async (req, res) => {
		let API = new APIBus({ app: { wp_host, app_host }, key: req.body });
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

	app.post('/webhook', (req, res) => {
		let topic = req.headers['x-wc-webhook-topic'];
		if(!topic) { return res.send({ topic: 'No topic!' }); }
		let data = req.body;
		console.log('topic: ', topic);
		console.log('data: ', data);
		// switch (topic) {
		// 	case 'order.updated':
		// 		console.log('order', data);
		// 		break;
		// 	case 'product.updated':
		// 		console.log('product', data);
		// 		break;
		// }
		res.send({ topic })
	})

	app.listen(PORT)
}
start({ app });