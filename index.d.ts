interface RequestOptions extends RequestInit {
	timeout?: number;
}

declare module 'fetch-beacon' {
	export default function(
		input: RequestInfo,
		init?: RequestOptions,
	): Promise<Response>;
}
