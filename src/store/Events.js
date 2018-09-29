import Vue from "vue";
import api from "../api";

import honk from  '../assets/sounds/honk.wav';
import applause from  "../assets/sounds/applause.wav";
import orgasm from  "../assets/sounds/orgasm.wav";
import whistle from  "../assets/sounds/whistle.wav";
import yeah from  "../assets/sounds/yeah.wav";
import wilhelm from  "../assets/sounds/wilhelm.wav";
import airhorn from  "../assets/sounds/airhorn.wav";
import brrrap from  "../assets/sounds/brrrap.wav";
import rastafari from  "../assets/sounds/rastafari.wav";


import {
    Howler,
    Howl
}
from 'howler';

Howler.volume(1);

var sounds = {
    'honk': [honk],
    'applause': [applause],
    'orgasm': [orgasm],
    'whistle': [whistle],
    'yeah': [yeah],
    'wilhelm': [wilhelm],
    'airhorn': [airhorn],
    'brrrap': [brrrap],
    'rastafari': [rastafari],

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
            if(!( event instanceof Array)){
                event = [event];
            }

            event.forEach(_event => {
                state.event = _event;
                state.events.push(_event);
    
                switch (_event.type) {
                    case "waitingForNextSong":
                        this.dispatch("Messages/toast", {
                            type: "deepsea",
                            html: "Next song: <b>" + _event.data.track.name + "</b>",
                            duration: 10
                        });
                        break;
                    case "playMySong":
                        this.dispatch("Messages/popup", {
                            type: "deepsea",
                            html: "<p>Playing your song:</p>" +
                                "<p><b>" + _event.data.track.name + "</b></p>" +
                                "<p>(" + _event.data.track.artists[0].name + ")</p>",
                            duration: 10,
                        });
                        break;
                    case "playSound":
                        let sound = howls[_event.data.sound];
                        if (sound) {
                            sound.play();
                        }
                        break;
                }
            });

        },
    },
}