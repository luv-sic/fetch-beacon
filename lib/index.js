import store from './store';
import { domReady } from './utils';

const cacheStatusCodes = [408, 413, 429, 500, 502, 503, 504];

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export class TimeoutError extends Error {
	constructor() {
		super('Request time out');
		this.name = 'TimeoutError';
	}
}

const withtimeout = (promise, ms) =>
	Promise.race([
		promise,
		(async () => {
			await delay(ms);
			throw new TimeoutError();
		})(),
	]);

const cacheQueueKey = 'cache_queue';

const clearCache = () => {
	const requests = getCache();
	if (!Array.isArray(requests)) return;
	const request = requests.shift();
	if (!request) return;
	const { input, options } = request;
	createInstance(input, options).then(() => {
		setCache(requests);
		clearCache();
	});
};

export const getCache = () => store.get(cacheQueueKey) || [];
const setCache = requests => {
	if (!Array.isArray(requests)) {
		requests = [];
	}
	store.set(cacheQueueKey, requests);
};

const enqueCache = request => {
	const queue = getCache();
	queue.push(request);
	setCache(cacheQueueKey, queue);
};

export const defaultOptions = {
	method: 'get',
	timeout: 10000,
	keepalive: true,
};

class Beacon {
	constructor(input, options) {
		this._options = {
			...defaultOptions,
			...options,
		};
		return this._fetchWithTimeout(input, this._options);
	}
	_fetchWithTimeout(input, options) {
		const { timeout } = this._options;
		return withtimeout(this._fetch(input, options), timeout);
	}
	_fetch(input, options) {
		return fetch(input, options).then(response => {
			if (!response.ok) {
				return Promise.reject(response);
			}
			return Promise.resolve(response);
		});
	}
}

const createInstance = (input, options) => new Beacon(input, options);

domReady(clearCache);

export default (input, options) =>
	createInstance(input, options).catch(error => {
		if (error instanceof TimeoutError) {
			enqueCache({ input, options });
			return Promise.reject(error);
		}
		if (cacheStatusCodes.indexOf(error.status) > -1) {
			enqueCache({ input, options });
		}
		return Promise.reject(error);
	});
