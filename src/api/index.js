import axios from "axios";
import auth from "./auth";
import queue from "./queue";
import misc from "./misc";
import spotify from "./spotify";
import { store } from "@/store";
import storage from "@/common/device-storage";

const api = {
    auth: null,
    queue: null,
    misc: null,
    spotify: null,
    axios: null,
    initialized: false,
    init,
};

const serverIP = storage.get("serverIP");
if (serverIP) {
    console.log("Got server ip from localstorage: ", serverIP);
    api.ip = serverIP;
    api.init(serverIP);
}

function init(serverIP) {
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
