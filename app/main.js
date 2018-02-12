import 'vueify/lib/insert-css';
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
import router from './router'
import socket from './socket'
import {
	store
} from './store'

new Vue({
	el: '#app',
	data: {
		currentRoute: window.location.pathname
	},
	beforeCreate() {
		store.commit('setSocket', this.$socket);
	},
	render: h => h(App),
	router,
	store,
})