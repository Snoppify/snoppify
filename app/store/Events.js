import Vue from "vue";
import api from "../api";

export default {
    namespaced: true,

    state: {
        event: null,
        events: [],
    },

    getters: {
        event: state => state.event,
        events: state => state.events,
    },

    mutations: {
        SOCKET_EVENT: (state, event) => {
            state.event = event;
            state.events.push(event);
        },
    },
}