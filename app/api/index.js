const axios = require("axios");
import {
    store
} from '../store';

const _axios = axios.create({
    baseURL: 'http://' + ($PROCESS_ENV_SERVER_IP || 'snoppi.fy') + ':3000',
    timeout: 5000,
    withCredentials: true,
});

_axios.interceptors.response.use(
    response => response.data,
    err => {
        if (err && err.response && err.response.data && err.response.data.error) {
            store.dispatch("Messages/toast", {
                type: "alert",
                message: err.response.data.error,
                duration: 2,
            });
        }
        return Promise.reject(err);
    }
);

export default {
    auth: require("./auth")(_axios),
    queue: require("./queue")(_axios),
    misc: require("./misc")(_axios),
    spotify: require("./spotify")(_axios),
};