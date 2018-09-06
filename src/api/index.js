import axios from "axios";
import auth from "./auth";
import queue from "./queue";
import misc from "./misc";
import spotify from "./spotify";
import { store } from '@/store';

const _axios = axios.create({
    baseURL: 'http://' + (process.env.VUE_APP_SERVER_IP || 'snoppi.fy') + ':3000',
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
    auth: auth(_axios),
    queue: queue(_axios),
    misc: misc(_axios),
    spotify: spotify(_axios),
};