class TimeoutError extends Error {
	constructor() {
		super('Request time out');
		this.name = 'TimeoutError';
	}
}

interface RequestOptions extends RequestInit {
  timeout: number;
}

declare module 'fetch-beacon' {
  export default function(input: RequestInfo, init?: RequestOptions): Promise<Response | TimeoutError>
}
