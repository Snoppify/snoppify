import io from "socket.io-client";
import Vue from "vue";
import VueSocketio from "vue-socket.io";

import { store } from "./store";

const socketInstance = io.connect(process.env.VUE_APP_SERVER_URI);

export default {
  init: () => {
    Vue.use(new VueSocketio({ connection: socketInstance, store }));
  },
};
