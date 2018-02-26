import 'vueify/lib/insert-css';
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
import router from './router'
import socket from './socket'
import {
    store
}
from './store'

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

import Fingerprint2 from "fingerprintjs2";

new Vue({
    el: '#app',
    data: {
        currentRoute: window.location.pathname
    },
    beforeCreate() {
        store.commit('init');
        store.commit('setSocket', this.$socket);
    },
    render: h => h(App),
    router,
    store,
})