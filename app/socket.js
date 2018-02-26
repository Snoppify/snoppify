import Vue from 'vue'
import VueSocketio from 'vue-socket.io'
import {
    store
}
from './store'

Vue.use(VueSocketio, 'http://' + ($PROCESS_ENV_SERVER_IP || 'snoppi.fy') + ':3000', store);

export default {}