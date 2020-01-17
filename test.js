let APIBus = require('./index')

// Port expressjs running
const PORT = process.env.HOST || 5000;
// Ngrok listen port 5000
const app_host = 'https://2143d9ae.ngrok.io';
const pathHook = `${app_host}/webhook`;
// Your woocommerce site
const wp_host = 'http://localhost:8080/QH1901';

let API = new APIBus({ app: { wp_host, app_host, app_name: 'MYAPP', return_url: 'return_url', callback_url: 'callback_url' } });
let url = API.buildLink();
console.log(url);