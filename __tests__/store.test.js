import store from '../lib/store';

const key_null = 'key_null';
const key_string = 'key_string';
const key_object = 'key_object';
const value_string = 'key_string_value';
const value_object = {
	a: 1,
	b: false,
	c: '3',
};

describe('basic fetch', () => {
	test('should return null', () => {
		expect(store.get(key_null)).toBe(null);
	});

	test('should return string', () => {
		store.set(key_string, value_string);
		expect(store.get(key_string)).toBe(value_string);
	});

	test('should return object', () => {
		store.set(key_object, value_object);
		expect(store.get(key_object)).toEqual(value_object);
	});
});
