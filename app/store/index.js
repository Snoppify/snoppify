import Vue from 'vue';
import Vuex from 'vuex';

import Spotify from './Spotify';
import Session from './Session';

Vue.use(Vuex);

export const store = new Vuex.Store({
	state: {
		io: {},
	},

	modules: {
		Spotify,
		Session,
	},

	mutations: {
		setSocket(state, socket) {
			state.io = socket;
		},
	}

})