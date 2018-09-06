import Vue from 'vue';
import VueSocketio from 'vue-socket.io';

import {
    store
} from './store';

export default {
    init: () => {
        Vue.use(VueSocketio, 'http://' + (process.env.VUE_APP_SERVER_IP || 'snoppi.fy') + ':3000', store);
    }
}