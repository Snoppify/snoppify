const prefix = (key) => `Snoppify_${key}`;

const storage = window.localStorage;

export default {
  set(key, value) {
    storage.setItem(prefix(key), JSON.stringify(value));
  },

  get(key) {
    const val = storage.getItem(prefix(key));
    return val && JSON.parse(val);
  },
};
