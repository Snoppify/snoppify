import api from "../api";

export default {
    namespaced: true,

    state: {
        user: {},
        username: "",
        wifiQR: "",
    },

    getters: {
        user: state => state.user,
        username: state => state.username,
        wifiQR: state => state.wifiQR,
    },

    mutations: {
        SET_SESSION: (state, sessionData) => {
            Object.assign(state.user, sessionData);
            state.username = sessionData.username;
        },

        SOCKET_EVENT(state, data) {
            var uVoter, uIssuer;

            switch (data.type) {
                case "friend.vote":
                    uVoter = data.data.voter;
                    uIssuer = data.data.user;
                    // issuer
                    if (uIssuer.username == state.username) {
                        state.user.votes.received[uVoter.username] = data.data.votes;
                        state.user.votes.receivedTotal = uIssuer.votes.receivedTotal;

                        if (data.data.vote == 1) {
                            this.dispatch("Messages/toast", {
                                type: "moss",
                                html: "<b>" + uVoter.displayName + "<b> upvoted your track!",
                                duration: 10,
                            });
                        }
                    }
                    // voter
                    if (uVoter.username == state.username) {
                        state.user.votes.given[uIssuer.username] = data.data.votes;
                        state.user.votes.givenTotal = uVoter.votes.givenTotal;
                    }
                    break;
                case "friend.new":
                    uVoter = data.data.voter;
                    uIssuer = data.data.user;
                    // issuer
                    if (uIssuer.username == state.username) {
                        state.user.friends = uIssuer.friends;

                        this.dispatch("Messages/popup", {
                            type: "deepsea",
                            html: "<p>New friend!</p>" +
                                "<p><b>" + uVoter.displayName + "</b> liked more than 3 of your tracks.</p>" +
                                "<p>You should be friends!</p>",
                            //duration: 10,
                        });
                    }
                    // voter
                    if (uVoter.username == state.username) {
                        state.user.friends = uVoter.friends;

                        this.dispatch("Messages/popup", {
                            type: "deepsea",
                            html: "<p>New friend!</p>" +
                                "<p>You liked more than 3 tracks queued by <b>" + uIssuer.displayName + "</b>.</p>" +
                                "<p>You should be friends!</p>",
                            //duration: 10,
                        });
                    }
                    break;
            }
        },
        SET_WIFI_QR(state, qr) {
            state.wifiQR = qr;
        }
    },

    actions: {
        CREATE_SESSION({
            commit
        }, username) {
            return api.auth.newUser(username).then(
                resp => {
                    commit("SET_SESSION", {
                        username,
                    });
                },
                err => {
                    console.log(err);
                },
            );
        },
        AUTH(context) {
            return api.auth.auth().then(
                sessionData => {
                    context.commit("SET_SESSION", sessionData);
                },
                err => {
                    console.log(err);
                },
            );
        },
        GET_WIFI_QR({
            commit
        }) {
            return api.axios.get("/wifi").then(s => commit("SET_WIFI_QR", s));
        },
    },
};