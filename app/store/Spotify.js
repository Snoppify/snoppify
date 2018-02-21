import Vue from 'vue'

export default {
    namespaced: true,

    state: {
        isConnected: false,
        storedResult: '',
        tracks: {},
        currentTrack: {},
        queue: [],
    },

    getters: {
        connected: state => state.isConnected,
        result: state => state.storedResult,
        track: state => id => state.tracks[id],
    },

    mutations: {
        SOCKET_CONNECT: state => state.isConnected = true,

        SOCKET_DISCONNECT: state => state.isConnected = false,

        SOCKET_SEARCH(state, message) {
            state.storedResult = JSON.parse(message);
        },

        SOCKET_GETTRACK(state, message) {
            var track = JSON.parse(message);
            Vue.set(state.tracks, track.id, track);
        },
    },

    actions: {
        search(context, query) {
            context.rootState.io.emit("search", query);
        },

        getTrack(context, id) {
            context.rootState.io.emit("getTrack", id);
        },
    }

}