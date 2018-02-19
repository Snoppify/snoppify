import Vue from 'vue';
import Vuex from 'vuex';

import Session from './Session';
import Spotify from './Spotify';
import Events from './Events';

Vue.use(Vuex);

export const store = new Vuex.Store({
    state: {
        io: {},
    },

    modules: {
        Spotify,
        Session,
        Events,
    },

    mutations: {
        setSocket(state, socket) {
            state.io = socket;
        },
    }

})