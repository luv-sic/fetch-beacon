import store from './store';

// const requestMethods = ['get', 'post', 'put', 'patch', 'head', 'delete'];

const retryStatusCodes = [408, 413, 429, 500, 502, 503, 504];

const retryAfterStatusCodes = [413, 429, 503];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class TimeoutError extends Error {
	constructor(message) {
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
	createInstance(input, options).then(res => {
		setCache(requests);
		clearCache();
	});
};

const getCache = () => store.get(cacheQueueKey) || [];
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

const defaultOptions = {
	method: 'get',
	retry: 2,
	timeout: 1000,
};

window.addEventListener('load', clearCache);

class Beacon {
	_retryCount = 0;
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
		const { retry } = options;
		this._retryCount++;
		return fetch(input, options).then(resp => {
			const shouldRetry = retryStatusCodes.includes(resp.status) && (this.retryCount <= retry);
			if (shouldRetry) {
				return this._fetchWithTimeout(input, options);
			}
			return retry;
		}).catch(() => enqueCache({ input, options }));
	}
	_calculateRetryDelay(error) {
		if ((error instanceof TimeoutError)) {
			if (error instanceof HTTPError) {
				if (!retryStatusCodes.has(error.response.status)) {
					return 0;
				}

				const retryAfter = error.response.headers.get('Retry-After');
				if (retryAfter && retryAfterStatusCodes.has(error.response.status)) {
					let after = Number(retryAfter);
					if (Number.isNaN(after)) {
						after = Date.parse(retryAfter) - Date.now();
					} else {
						after *= 1000;
					}

					return after;
				}

				if (error.response.status === 413) {
					return 0;
				}
			}

			const BACKOFF_FACTOR = 0.3;
			return BACKOFF_FACTOR * (2 ** (this._retryCount - 1)) * 1000;
		}

		return 0;
	}
}

const createInstance = (input, options) => new Beacon(input, options);

export default createInstance;
