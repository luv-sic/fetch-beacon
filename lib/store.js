const prefix = 'fetch_beacon_';

const store = {
	get(key) {
		if (!key) return null;
		return localStorage.getItem(prefix + key);
	},
	set(key, val) {
		localStorage.setItem(prefix + key, val);
  },
};

export default store;