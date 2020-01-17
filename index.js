const express = require('express');
const request = require('request');
const _ = require('lodash');
const bodyParser= require('body-parser');
const app = express();

let app_name = 'MYAPP';
let version = 'wc/v1';

let app_host = 'https://ebab3545.ngrok.io'
let wp_host = 'http://localhost:8080/QH1901'

let url = `${wp_host}/wc-auth/v1/authorize?app_name=${app_name}&scope=read_write&user_id=1&return_url=${app_host}/return_url&callback_url=${app_host}/callback_url`;
console.log(url)

let start = ({ app }) => {
	app.use(bodyParser.urlencoded({ extended: false }))
	app.use(bodyParser.json())

	app.get('/return_url', (req, res) => {
		res.send(req.body)
	})

	app.post('/callback_url', async (req, res) => {
		let { key_id, user_id, consumer_key, consumer_secret, key_permissions } = req.body;
		let oauth =
		{
			callback: app_host, 
			consumer_key: consumer_key, 
			consumer_secret: consumer_secret
		}
		let webhooks = await callApi(WOO.WEBHOOKS.LIST, req.body);
		for (let i = 0; i < listWebhooks.length; i++) {
			let webhook = listWebhooks[i];
			let found = webhooks.find(e => e.topic == webhook.topic);
			if(found){
				updateHook({ id: found.id, ...webhook, delivery_url: pathHook})
			} else{
				createHook({ id: found.id, ...webhook, delivery_url: pathHook})
			}
		}
		res.send(req.body)
	})

	app.post('/webhook', (req, res) => {
		let topic = req.headers['X-Wc-Webhook-Topic'];
		let data = req.body;
		console.log('topic: ', topic);
		switch(topic){
			case 'order.updated':
			console.log('order', data);
			break;
			case 'product.updated':
			console.log('product', data);
			break;
		}
		res.send({ topic })
	})

	app.listen(process.env.HOST || 3000)
}

start({ app });

const compile = (template, data) => {
	let result = template.toString ? template.toString() : '';
	result = result.replace(/{.+?}/g, function (matcher) {
		var path = matcher.slice(1, -1).trim();
		return _.get(data, path, '');
	});
	return result;
}

const callApi = (option, plus) => {
	return new Promise((resolve, reject) => {
		let config = {
			"key_id": 5,
			"user_id": "1",
			"consumer_key": "ck_29e1e551ad79a2aabe89abe79dd1aac5e0758cbf",
			"consumer_secret": "cs_c300baffe04f97296dd210ed691706e18e476fd8",
			"key_permissions": "read_write"
		}
		let { key_id, user_id, consumer_key, consumer_secret, key_permissions } = config;

		let oauth =
		{
			callback: app_host, 
			consumer_key: consumer_key, 
			consumer_secret: consumer_secret
		}
		option.auth = oauth;

		let url_custom = _.cloneDeep(option.url);
		if(plus && plus.params){
			url_custom = compile(url_custom, plus.params);
			delete plus.params;
		}
		let url = `${wp_host}/wp-json/wc/v1/${url_custom}`;

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
		if(['post', 'put'].indexOf(option.method) != -1){
			finalConfig.headers['Content-Type'] = 'application/json',
			finalConfig.body = option.body;
		}
		request(finalConfig, function (e, r, body) {
			let data = JSON.parse(body);
			resolve(data);
		})
	});
}

let WOO = {};
WOO.WEBHOOKS = {
	LIST: {
		method: `get`,
		url: `webhooks`
	},
	CREATE: {
		method: `post`,
		url: `webhooks`,
		data: {}
	},
	UPDATE: {
		method: `put`,
		url: `webhooks/{id}`,
		body: {}
	}
}

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

const createHook = async hook => {
	try{
		console.log('create webhooks')
		callApi(WOO.WEBHOOKS.CREATE, { body: hook });
	} catch(error){
		console.log(error)
	}
}

const updateHook = async hook => {
	try{
		console.log(`update webhooks/${hook.id}`)
		callApi(WOO.WEBHOOKS.UPDATE, { params: { id: hook.id }, body: JSON.stringify(hook) });
	} catch(error){
		console.log(error)
	}
}

async function test(){
	let webhooks = await callApi(WOO.WEBHOOKS.LIST);
	for (let i = 0; i < listWebhooks.length; i++) {
		let webhook = listWebhooks[i];
		let found = webhooks.find(e => e.topic == webhook.topic);
		if(found){
			updateHook({ id: found.id, ...webhook, delivery_url: pathHook})
		} else{
			createHook({ id: found.id, ...webhook, delivery_url: pathHook})
		}
	}
}
// test();