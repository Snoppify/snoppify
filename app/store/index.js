import Vue from 'vue';
import Vuex from 'vuex';

import Session from './Session';
import Spotify from './Spotify';
import Events from './Events';
import Queue from './Queue';

Vue.use(Vuex);

export const store = new Vuex.Store({
    state: {
        io: {},
    },

    modules: {
        Spotify,
        Session,
        Events,
        Queue,
    },

    mutations: {
        /**
         * Commits "init" on the modules if the mutation is defined.
         */
        init(state) {
            for (let m in this._modules.root._children) {
                let module = this._modules.root._children[m];
                if (module._rawModule.mutations["init"]) {
                    module.context.commit("init");
                }
            }
        },

        setSocket(state, socket) {
            state.io = socket;
        },
    }

})