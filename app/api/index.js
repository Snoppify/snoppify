const axios = require("axios");

const _axios = axios.create({
    baseURL: 'http://' + ($PROCESS_ENV_SERVER_IP || 'localhost') + ':3000',
    timeout: 1000,
    withCredentials: true,
});

_axios.interceptors.response.use(
    response => response.data,
    err => Promise.reject(err)
);

export default {
    auth: require("./auth")(_axios),
    queue: require("./queue")(_axios),
    misc: require("./misc")(_axios),
};