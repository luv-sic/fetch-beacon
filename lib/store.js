const prefix = 'FETCH_BEACON_';

const store = {
	get(key) {
		const item = localStorage.getItem(prefix + key);
		try {
			return item ? JSON.parse(item) : item;
		} catch (e) {
			return null;
		}
	},
	set(key, val) {
		try {
			const item = val ? JSON.stringify(val) : val;
			localStorage.setItem(prefix + key, item);
		} catch (e) {
			// none
		}
	},
};

export default store;
