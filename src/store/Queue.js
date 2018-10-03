import Vue from "vue";

export default {
    namespaced: true,

    state: {
        queue: [],
        currentTrack: {},
        backupPlaylist: null,
    },

    getters: {
        currentTrack: state => state.currentTrack,
        backupPlaylist: state => state.backupPlaylist,
        queue: state => state.queue,
    },

    mutations: {
        SET_CURRENT_TRACK(state, track) {
            state.currentTrack = track;
        },

        SET_BACKUP_PLAYLIST(state, playlist) {
            //state.backupPlaylist = playlist;
            Vue.set(state, "backupPlaylist", playlist);
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
                case "backupPlaylist":
                    state.backupPlaylist = data.data.playlist;
                    break;
            }
        },

        SOCKET_QUEUE(state, data) {
            state.queue = data.queue;
        },
    },



}