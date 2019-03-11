import store from './store';

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
			return Promise.reject(new TimeoutError());
		})(),
	]);

const cacheQueueKey = 'cache_queue';

export const clearCache = () => {
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
	setCache(queue);
};

export const defaultOptions = {
	method: 'get',
	timeout: 10000,
	// see issue https://bugs.chromium.org/p/chromium/issues/detail?id=810466
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
		return fetch(input, options);
	}
}

const createInstance = (input, options) => new Beacon(input, options);

// clear cached request
clearCache();

const beacon = (input, options) =>
	createInstance(input, options)
		.then(response => {
			if (cacheStatusCodes.indexOf(response.status) > -1) {
				enqueCache({ input, options });
			}
			return Promise.resolve(response);
		})
		.catch(error => {
			if (error instanceof TimeoutError) {
				enqueCache({ input, options });
			}
			return Promise.reject(error);
		});

export default beacon;
