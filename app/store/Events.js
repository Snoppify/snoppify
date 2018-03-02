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
        SOCKET_EVENT(state, event) {
            state.event = event;
            state.events.push(event);

            switch (event.type) {
                case "waitingForNextSong":
                    this.dispatch("Messages/toast", {
                        type: "deepsea",
                        html: "Next song: <b>" + event.data.track.name + "</b>",
                        duration: 10
                    });
                    break;
            }
        },
    },
}