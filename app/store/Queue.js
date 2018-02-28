import Vue from "vue";

export default {
    namespaced: true,

    state: {
        queue: [],
        currentTrack: {},
    },

    getters: {
        currentTrack: state => state.currentTrack,
        queue: state => state.queue,
    },

    mutations: {
        SET_CURRENT_TRACK(state, track) {
            state.currentTrack = track;
        },

        SET_QUEUE(state, queue) {
            state.queue = queue;
        },

        SOCKET_EVENT(state, data) {
            switch (data.type) {
                case "playSong":
                case "playing":
                case "paused":
                    state.currentTrack = data.data.track;
                    break;
            }
        },

        SOCKET_QUEUE(state, data) {
            state.queue = data.queue;
        },
    },



}