const axios = require("axios");

const _axios = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 1000,
    withCredentials: true,
});

export default {
    auth: require("./auth")(_axios),
};