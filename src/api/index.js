import storage from "@/common/device-storage";
import { store } from "@/store";
import axios from "axios";

import auth from "./auth";
import misc from "./misc";
import queue from "./queue";
import spotify from "./spotify";

const api = {
    auth: null,
    queue: null,
    misc: null,
    spotify: null,
    axios: null,
    initialized: false,
    init,
};

let serverIP = storage.get("serverIP");
api.ip = serverIP;

api.init(serverIP);

function init(serverIP) {
    if (!serverIP) {
        console.error("No server ip set");
        return;
    }

    storage.set("serverIP", serverIP);

    const _axios = axios.create({
        baseURL: window.location.protocol + "//" + serverIP + ":3000",
        timeout: 5000,
        withCredentials: true,
    });

    _axios.interceptors.response.use(
        response => response.data,
        err => {
            if (
                err &&
                err.response &&
                err.response.data &&
                err.response.data.error
            ) {
                store.dispatch("Messages/toast", {
                    type: "alert",
                    message: err.response.data.error,
                    duration: 2,
                });
            }
            return Promise.reject(err);
        },
    );

    Object.assign(api, {
        auth: auth(_axios),
        queue: queue(_axios),
        misc: misc(_axios),
        spotify: spotify(_axios),
        axios: _axios,
        initialized: true,
    });
}

export default api;
