# fetch-beacon

> A tiny HTTP client that implements sendBeacon API

## Why fetch-beacon

* implements [`navigator.sendBeacon`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon), which is useful for analytics and diagnostics needs.
* simple API as fetch
* timeout and ~~retry~~ support
* custom instance

## Install

```
$ npm install fetch-beacon
```

## Usage

```JavaScript
import beacon from 'fetch-beacon';

(async () => {
	const resp = await beacon('https://example.com', {json: {foo: true}});
	console.log(resp.json());
	//=> `{data: '🦄'}`
})();
```

## API

### beacon(input, [options])

Same as [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch), except folloing option.

Unlike fetch, `fetch-beacon` will throw an Error if the response status code is not 2XX, it will cache the failed request when get below status code and retry it when document load again.

Status codes: 408 413 429 500 502 503 504

#### options.timeout
Type: `number`,
Default: 10000

#### options.keepalive
Type: `boolean`,
Default: true

~~#### options.retry~~
Type: `number`,
Default: 2

Retry failed request if get one of following code.
