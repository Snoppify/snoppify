import axios from "axios";
import { store } from "@/store";
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

api.init();

function init() {
  const _axios = axios.create({
    baseURL: process.env.VUE_APP_SERVER_URI,
    timeout: 5000,
    withCredentials: true,
  });

  _axios.interceptors.response.use(
    (response) => response.data,
    (err) => {
      if (err && err.response && err.response.data && err.response.data.error) {
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
