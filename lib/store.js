const prefix = 'fetch_beacon_';

const store = {
	get(key) {
		if (!key) return null;
		const item = localStorage.getItem(prefix + key);
		return item ? JSON.parse(item) : item;
	},
	set(key, val) {
		const item = val ? JSON.stringify(val) : val; 
		localStorage.setItem(prefix + key, item);
  },
};

export default store;