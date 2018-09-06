import Vue from "vue";
import api from "../api";

import {
    Howler,
    Howl
}
from 'howler';

Howler.volume(1);

var sounds = {
    'honk': ['sounds/honk.wav'],
    'applause': ["sounds/applause.wav"],
    'orgasm': ["sounds/orgasm.wav"],
    'whistle': ["sounds/whistle.wav"],
    'yeah': ["sounds/yeah.wav"],
    'wilhelm': ["sounds/wilhelm.wav"],
    'airhorn': ["sounds/airhorn.wav"],
    'brrrap': ["sounds/brrrap.wav"],
    'rastafari': ["sounds/rastafari.wav"],

};
let howls = {};
for (let k in sounds) {
    howls[k] = new Howl({
        src: sounds[k]
    });
}

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
                case "playMySong":
                    this.dispatch("Messages/popup", {
                        type: "deepsea",
                        html: "<p>Playing your song:</p>" +
                            "<p><b>" + event.data.track.name + "</b></p>" +
                            "<p>(" + event.data.track.artists[0].name + ")</p>",
                        duration: 10,
                    });
                    break;
                case "playSound":
                    let sound = howls[event.data.sound];
                    if (sound) {
                        sound.play();
                    }
                    break;
            }
        },
    },
}