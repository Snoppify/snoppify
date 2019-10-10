import { Howl, Howler } from "howler";

import airhorn from "../assets/sounds/airhorn.wav";
import applause from "../assets/sounds/applause.wav";
import brrrap from "../assets/sounds/brrrap.wav";
import honk from "../assets/sounds/honk.wav";
import orgasm from "../assets/sounds/orgasm.wav";
import rastafari from "../assets/sounds/rastafari.wav";
import whistle from "../assets/sounds/whistle.wav";
import wilhelm from "../assets/sounds/wilhelm.wav";
import yeah from "../assets/sounds/yeah.wav";

import inception from "../assets/sounds/inception.mp3";
import mario1 from "../assets/sounds/sm64_mario_burned.wav";
import mario2 from "../assets/sounds/sm64_mario_here_we_go.wav";
import mario3 from "../assets/sounds/sm64_mario_lets_go.wav";
import yoshi1 from "../assets/sounds/sm64_yoshi.wav";
import yoshi2 from "../assets/sounds/smsunshine_yoshi_out_of_juice.wav";
import yoshi3 from "../assets/sounds/smsunshine_yoshi_tongue_grab.wav";

Howler.volume(1);

var sounds = {
    honk: [honk],
    applause: [applause],
    orgasm: [orgasm],
    whistle: [whistle],
    yeah: [yeah],
    wilhelm: [wilhelm],
    airhorn: [airhorn],
    brrrap: [brrrap],
    rastafari: [rastafari],
    inception: [inception],
    mario1: [mario1],
    mario2: [mario2],
    mario3: [mario3],
    yoshi1: [yoshi1],
    yoshi2: [yoshi2],
    yoshi3: [yoshi3],
};
let howls = {};
for (let k in sounds) {
    howls[k] = new Howl({
        src: sounds[k],
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
            if (!(event instanceof Array)) {
                event = [event];
            }

            event.forEach(_event => {
                state.event = _event;
                state.events.push(_event);

                switch (_event.type) {
                    case "waitingForNextSong":
                        this.dispatch("Messages/toast", {
                            type: "deepsea",
                            html:
                                "Next song: <b>" +
                                _event.data.track.name +
                                "</b>",
                            duration: 10,
                        });
                        break;
                    case "playMySong":
                        this.dispatch("Messages/popup", {
                            type: "deepsea",
                            html:
                                "<p>Playing your song:</p>" +
                                "<p><b>" +
                                _event.data.track.name +
                                "</b></p>" +
                                "<p>(" +
                                _event.data.track.artists[0].name +
                                ")</p>",
                            duration: 10,
                        });
                        break;
                    case "playSound":
                        {
                            let sound = howls[_event.data.sound];
                            if (sound) {
                                sound.play();
                            }
                        }
                        break;
                }
            });
        },
    },
};
