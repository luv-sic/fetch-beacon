import createTestServer from 'create-test-server';
import beacon, { TimeoutError } from '../lib';

jest.setTimeout(12000);
jest.useFakeTimers();

let server;
const plaintext = 'plain text';
beforeEach(async () => {
	server = await createTestServer();
	server.get('/', async (request, response) => {
		response.end(plaintext)
	});
	server.get('/500', async (request, response) => {
		response.status(500).end()
	});
	server.post('/timeout/11s', async (request, response) => {
		setTimeout(() => {
			response.end(plaintext)
		}, 11000);
	});
	server.post('/timeout/5s', async (request, response) => {
		setTimeout(() => {
			response.end(plaintext)
		}, 5000);
	});
});

describe('basic fetch', async () => {
	it('should fetch normally', async () => {
		const response = await beacon(server.url);
		expect(response.ok).toBe(true);
	})

	it('should return 500', async () => {
		return beacon(server.url+ '/500').catch(response => {
			expect(response.status).toBe(500);
		})
	})

	it('should return TimeoutError with default timeout', async () => {
		return beacon(server.url + '/timeout/11s', {
			method: 'post'
		}).catch(error => {
			expect(error instanceof TimeoutError).toBe(true);
		})
	});

	it('should return TimeoutError with custom timeout', async () => {
		return beacon(server.url + '/timeout/5s', {
			method: 'post',
			timeout: 6000
		}).catch(error => {
			console.log('error :', JSON.stringify(error));
			expect(error instanceof TimeoutError).toBe(true);
		})
	});
});

afterEach(async () => await server.close())