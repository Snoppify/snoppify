import Vue from "vue";

export default {
    namespaced: true,

    state: {
        isConnected: false,
        storedResult: "",
        tracks: {},
        currentTrack: {},
        queue: [],
        player: {},
    },

    getters: {
        connected: state => state.isConnected,
        result: state => state.storedResult,
        track: state => id => state.tracks[id],
        player: state => state.player,
    },

    mutations: {
        SOCKET_CONNECT: state => (state.isConnected = true),

        SOCKET_DISCONNECT: state => (state.isConnected = false),

        SOCKET_SEARCH(state, message) {
            state.storedResult = JSON.parse(message);
        },

        SOCKET_GETTRACK(state, message) {
            var track = JSON.parse(message);
            Vue.set(state.tracks, track.id, track);
        },

        SOCKET_EVENT(state, event) {
            switch (event.type) {
                case "player":
                    state.player = event.data;
                    break;
            }
        },
    },

    actions: {
        search(context, query) {
            context.rootState.io.emit("search", query);
        },

        getTrack(context, id) {
            context.rootState.io.emit("getTrack", id);
        },
    },
};
