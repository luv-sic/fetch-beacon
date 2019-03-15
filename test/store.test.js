import test from 'ava';
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

test('basic fetch', t => {
	t.is(store.get(key_null), null, 'should return null');

	store.set(key_string, value_string);
	t.is(store.get(key_string), value_string, 'should return string');

	store.set(key_object, value_object);
	t.deepEqual(store.get(key_object), value_object, 'should return object');
});
