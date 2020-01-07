const express= require('express');
const WooCommerceAPI = require('woocommerce-api');
const bodyParser= require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

let app_name = 'MYAPP';
let app_host = 'https://411815d1.ngrok.io'
let wp_host = 'http://localhost:8080/QH1901'
let url = `http://localhost:8080/QH1901/wc-auth/v1/authorize?app_name=${app_name}&scope=read_write&user_id=1&return_url=${app_host}/return_url&callback_url=${app_host}/callback_url`;
console.log(url)

app.get('/return_url', (req, res) => {
	res.send(req.body)
})

app.post('/callback_url', async (req, res) => {
	let { key_id, user_id, consumer_key, consumer_secret, key_permissions } = req.body;
	var WooCommerce = new WooCommerceAPI({
		url: app_host,
		consumerKey: consumer_key,
		consumerSecret: consumer_secret,
		wpAPI: true,
		version: 'wc/v1'
	});

	let webhooks = await callApi.get(WooCommerce, 'webhooks');
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
	res.send(req.body)
})

const callApi = {
	get: (WooCommerce, endpoint) => {
		return new Promise((resolve,  reject) => {
			WooCommerce.get(endpoint, (err, result) => {
				if (err) return reject(err);
				let data = JSON.parse(result.body);
				if(!data) return reject();
				resolve(data);
			})
		})
	},
	post: (WooCommerce, endpoint, data) => {
		return new Promise((resolve,  reject) => {
			WooCommerce.post(endpoint, data, (err, result) => {
				if (err) return reject(err);
				let data = JSON.parse(result.body);
				if(!data) return reject();
				resolve(data);
			})
		})
	},
	put: (WooCommerce, endpoint, data) => {
		return new Promise((resolve,  reject) => {
			WooCommerce.put(endpoint, data, (err, result) => {
				if (err) return reject(err);
				let data = JSON.parse(result.body);
				if(!data) return reject();
				resolve(data);
			})
		})
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

let config = {
	"key_id": 5,
	"user_id": "1",
	"consumer_key": "ck_29e1e551ad79a2aabe89abe79dd1aac5e0758cbf",
	"consumer_secret": "cs_c300baffe04f97296dd210ed691706e18e476fd8",
	"key_permissions": "read_write"
}
let { key_id, user_id, consumer_key, consumer_secret, key_permissions } = config
var WooCommerce = new WooCommerceAPI({
	url: wp_host,
	consumerKey: consumer_key,
	consumerSecret: consumer_secret,
	wpAPI: true,
	version: 'wc/v1'
});

const createHook = hook => {
	try{
		console.log('create')
		callApi.post(WooCommerce, 'webhooks', hook);
	} catch(error){
		console.log(error)
	}
}

const updateHook = hook => {
	try{
		console.log(`webhooks/${hook.id}`)
		callApi.put(WooCommerce, `webhooks/${hook.id}`, hook);
	} catch(error){
		console.log(error)
	}
}

async function test(){
	let webhooks = await callApi.get(WooCommerce, 'webhooks');
	console.log(webhooks)
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
test()

app.listen(3000)