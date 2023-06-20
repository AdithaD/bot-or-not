import { handler } from './build/handler.js';
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import('./bot-server/build/bot.cjs');

const app = express();

const httpServer = http.createServer(app);
console.log('process.env.SSL', process.env.SSL);
if (process.env.SSL && process.env.SSL == 'TRUE') {
	const privateKey = fs.readFileSync(path.join(__dirname, 'ssl/privkey.pem'), 'utf8');
	const certificate = fs.readFileSync(path.join(__dirname, 'ssl/fullchain.pem'), 'utf8');
	const credentials = { key: privateKey, cert: certificate };
	const httpsServer = https.createServer(credentials, app);
	httpsServer.listen(SSLPORT, function () {
		console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
	});
}

const PORT = 80;
const SSLPORT = 443;

httpServer.listen(PORT, function () {
	console.log('HTTP Server is running on: http://localhost:%s', PORT);
});

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);
