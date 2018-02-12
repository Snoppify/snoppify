import Vue from 'vue';
import Vuex from 'vuex';
import Spotify from './Spotify';

Vue.use(Vuex);

export const store = new Vuex.Store({
	state: {
		io: {},
	},

	modules: {
		Spotify,
	},

	mutations: {
		setSocket(state, socket) {
			state.io = socket;
		},
	}

})