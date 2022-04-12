import Vue from "vue";
import VueSocketio from "vue-socket.io";

import { store } from "./store";

export default {
  init: () => {
    Vue.use(VueSocketio, process.env.VUE_APP_SERVER_URI, store);
  },
};
