// import 'vueify/lib/insert-css';
import Vue from 'vue'
// import Vuex from 'vuex'
import App from './App'
import router from './router'
import socket from './socket'
import {
    store
}
    from './store'
import api from "./api";
import storage from "./common/device-storage";

// global components
import TrackItem from "./components/TrackItem";

// Remove the ugly Facebook appended hash
// <https://github.com/jaredhanson/passport-facebook/issues/12>
if (window.location.hash && window.location.hash === "#_=_") {
    if (window.history && history.pushState) {
        window.history.pushState("", document.title, window.location.pathname);
    } else {
        // Prevent scrolling by storing the page's current scroll offset
        var _scroll = {
            top: document.body.scrollTop,
            left: document.body.scrollLeft
        };
        window.location.hash = "";
        // Restore the scroll offset, should be flicker free
        document.body.scrollTop = _scroll.top;
        document.body.scrollLeft = _scroll.left;
    }
}

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
    el: '#app',
    data: {
        currentRoute: window.location.pathname
    },
    beforeCreate() {
        store.commit('init');
        // TODO: Move to after the server has been found
        store.commit('setSocket', this.$socket);
    },
    render: h => h(App),
    router,
    store,
});

Vue.component("track-item", TrackItem);

// TODO: Move to after the server has been found
socket.init(api.ip);