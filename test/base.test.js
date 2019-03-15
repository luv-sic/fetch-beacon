import test from 'ava';
const sinon = require('sinon');
import createTestServer from 'create-test-server';
import beacon, {
	TimeoutError,
	getCache,
	defaultOptions,
	delay,
	OffLineError,
	setCache,
	clearCache,
} from '../lib';

const plaintext = 'plain text';

let server;

test.before(async () => {
	setCache([]);
	navigator.onLine = true;
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

test.afterEach(async () => {
	setCache([]);
	navigator.onLine = true;
});

test('basic fetch', async t => {
	const response = await beacon(server.url);
	t.is(response.ok, true, 'should return 200');

	const errorUrl = server.url + '/500';
	const response2 = await beacon(errorUrl, {
		method: 'put',
	});
	t.is(response2.status, 500, 'should return 500');
});

test('fetch with timeout', async t => {
	await t.throwsAsync(
		beacon(`${server.url}/timeout/11s`, { method: 'delete' }),
		TimeoutError,
	);
	navigator.onLine = true;
	await t.throwsAsync(
		beacon(`${server.url}/timeout/2s`, {
			timeout: 1000,
			method: 'post',
		}),
		TimeoutError,
	);
});

test('fetch with offline', async t => {
	navigator.onLine = false;
	await t.throwsAsync(beacon(`${server.url}`), OffLineError);
});

test('fetch with cache', async t => {
	navigator.onLine = true;
	const input = server.url + '/timeout/2s';
	const options = {
		...defaultOptions,
		timeout: 1000,
		method: 'post',
	};
	await t.throwsAsync(
		beacon(input, options),
		TimeoutError,
		'should throw TimeoutError',
	);
	await delay(1000);
	t.deepEqual(
		getCache().shift(),
		{ input, options },
		'should cache failed request',
	);

	navigator.onLine = false;
	await t.throwsAsync(beacon(input, options), OffLineError);
	// const times = getCache().length;
	// sinon.spy(clearCache)
	// clearCache();
	// await delay(1000);
	// t.is(clearCache.call, times);
});
