import { Howl, Howler } from "howler";

import sounds from "../common/sounds";

Howler.volume(1);

let howls = {};
for (let k in sounds) {
    howls[k] = new Howl({
        src: sounds[k].sound,
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
                    case "newUser":
                        this.dispatch("Messages/toast", {
                            type: "peach",
                            html:
                                "<img src='" + _event.data.profile + "' style='width:24px;height:24px;border-radius:99px;vertical-align:middle;margin-right:8px;'>" +
                                "<b>" +
                                _event.data.displayName +
                                "</b> just joined!",
                            duration: 10,
                        });
                        break;
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
