import fetch, { Headers, Response } from 'node-fetch';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM(``, {
	url: 'http://localhost/',
	referrer: 'http://localhost/',
	contentType: 'text/html',
	includeNodeLocations: true,
});

const { localStorage, navigator } = window;
global.localStorage = localStorage;
global.navigator = navigator;

Object.defineProperties(navigator, {
	onLine: {
		writable: true,
	},
});

global.fetch = fetch;
global.Headers = Headers;
global.Response = Response;
