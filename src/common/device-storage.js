const prefix = (key) => "Snoppify_" + key;

const storage = window.localStorage;

export default {
    set(key, value) {
        value = JSON.stringify(value);
        storage.setItem(prefix(key), value);
    },

    get(key) {
        const val = storage.getItem(prefix(key));
        return val && JSON.parse(val);
    }
}