import createTestServer from 'create-test-server';
import beacon, { TimeoutError, getCache, defaultOptions, delay, clearCache } from '../lib';

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
		await delay(11000)
		response.end(plaintext);
	});
	server.post('/timeout/2s', async (request, response) => {
		await delay(2000)
		response.end(plaintext);
	});
});

afterEach(async () => {
	await server.close()
	jest.clearAllTimers()
});

describe('basic fetch', async () => {
	test('should fetch normally', async () => {
		const response = await beacon(server.url);
		expect(response.ok).toBe(true);
	});

	test('should return 500', async () => {
		const errorUrl = server.url + '/500';
		return beacon(errorUrl, {
			method: 'put'
		}).catch(response => {
			expect(response.status).toBe(500);
		});
	});
});

describe('fetch with timeout', async () => {
	test('should return TimeoutError with default timeout', async () => {
		return beacon(server.url + '/timeout/11s', {
			method: 'delete',
		}).catch(error => {
			expect(error).toBeInstanceOf(TimeoutError);
		});
	});
	
	test('should return TimeoutError with custom timeout', async () => {
		return beacon(server.url + '/timeout/2s', {
			method: 'post',
			timeout: 1000,
		}).catch(error => {
			expect(error).toBeInstanceOf(TimeoutError);
		});
	});
})

describe('fetch with cache', async () => {
	test('should cache failed request', async () => {
		const timeoutUrl = server.url + '/timeout/2s';
		const options = {
			timeout: 1000,
		}
		return beacon(timeoutUrl, options).catch(() => {
			expect(getCache()[0]).toEqual({
				input: timeoutUrl,
				options: {
					...defaultOptions,
					...options,
				},
			})
		});
	});

	test('should clear cache when document reload', async () => {
		// const times = getCache().length;
		// return (async () => {
		// 	await delay(5000)
		// 	expect(clearCache).toBeCalledTimes(times)
		// })()
	});
})