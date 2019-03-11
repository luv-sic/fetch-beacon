import createTestServer from 'create-test-server';
import beacon, { TimeoutError, getCache, defaultOptions, delay } from '../lib';

let server;
const plaintext = 'plain text';
beforeEach(async () => {
	jest.setTimeout(12000);
	server = await createTestServer();
	server.get('/', async (request, response) => {
		response.end(plaintext);
	});
	server.put('/500', async (request, response) => {
		response.status(500).end('');
	});
	server.delete('/timeout/11s', async (request, response) => {
		await delay(11000);
		response.end(plaintext);
	});
	server.post('/timeout/2s', async (request, response) => {
		await delay(2000);
		response.end(plaintext);
	});
});

afterEach(async () => {
	await server.close();
	jest.clearAllTimers();
	jest.restoreAllMocks();
});

describe('basic fetch', async () => {
	test('should fetch normally', async () => {
		const response = await beacon(server.url);
		expect(response.ok).toBe(true);
	});

	test('should return 500', async () => {
		const errorUrl = server.url + '/500';
		return beacon(errorUrl, {
			method: 'put',
		}).catch(response => {
			expect(response.status).toBe(500);
		});
	});
});

describe('fetch with timeout', async () => {
	// test('should return TimeoutError with default timeout', async () => {
	// 	return beacon(server.url + '/timeout/11s', {
	// 		method: 'delete',
	// 	}).catch(error => {
	// 		expect(error).toBeInstanceOf(TimeoutError);
	// 	});
	// });

	test('should return TimeoutError with custom timeout', async () => {
		return beacon(server.url + '/timeout/2s', {
			method: 'post',
			timeout: 1000,
		}).catch(error => {
			expect(error).toBeInstanceOf(TimeoutError);
		});
	});
});

describe('fetch with cache', async () => {
	test('should cache failed request', async () => {
		const input = server.url + '/timeout/2s';
		const options = {
			...defaultOptions,
			timeout: 1000,
		};
		return beacon(input, options).catch(() => {
			expect(getCache().shift()).toEqual({
				input,
				options,
			});
		});
	});

	test('should clear cache when document reload', async () => {
		jest.mock('../lib', () => {
			return {
				clearCache: jest.fn(() => Promise.resolve()),
			};
		});
		const { clearCache } = require('../lib');
		const times = getCache().length;
		expect(clearCache).toBeCalledTimes(times);
	});
});
