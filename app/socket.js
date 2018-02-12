import Vue from 'vue'
import VueSocketio from 'vue-socket.io'
import {
	store
} from './store'

Vue.use(VueSocketio, 'http://localhost:3000', store);

export default {}