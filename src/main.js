// import 'vueify/lib/insert-css';
import Vue from "vue";

import App from "./App";
import router from "./router";
import { store } from "./store";

import TrackItem from "./components/TrackItem";
import Modal from "./common/Modal";

// import Vuex from 'vuex'
// global components
// Remove the ugly Facebook appended hash
// <https://github.com/jaredhanson/passport-facebook/issues/12>
if (window.location.hash && window.location.hash === "#_=_") {
  if (window.history && history.pushState) {
    window.history.pushState("", document.title, window.location.pathname);
  } else {
    // Prevent scrolling by storing the page's current scroll offset
    const _scroll = {
      top: document.body.scrollTop,
      left: document.body.scrollLeft,
    };
    window.location.hash = "";
    // Restore the scroll offset, should be flicker free
    document.body.scrollTop = _scroll.top;
    document.body.scrollLeft = _scroll.left;
  }
}

(() => {
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
})();

// Redirect in case of auth
// const href = window.location.href;
// if (href.includes("?authcallback")) {
//     const params = new URLSearchParams(href.substr(href.indexOf("?") + 1));
//     const newParams = new URLSearchParams();

//     switch (params.get("type")) {
//         case "facebook":

//             break;
//     }

//     console.log(params);

//     window.location.href = "http://" + PROCESS.env
// }

new Vue({
  el: "#app",
  data: {
    currentRoute: window.location.pathname,
  },
  beforeCreate() {
    store.commit("init");
  },
  render: (h) => h(App),
  router,
  store,
});

Vue.component("track-item", TrackItem);
Vue.component("modal", Modal);
