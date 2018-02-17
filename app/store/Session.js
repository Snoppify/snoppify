import axios from "axios";
import Vue from "vue";

function url(endpoint) { return "http://localhost:3000/" + endpoint; }

export default {
    namespaced: true,

    state: {
        username: "",
    },

    getters: {
        username: state => state.username,
    },

    mutations: {
        SET_SESSION: (state, sessionData) => Object.assign(state, sessionData),
    },

    actions: {
        CREATE_SESSION({ commit }, username) {
            axios.post(url("new-user"), { username, }, { withCredentials: true })
                .then(resp => {
                    commit("SET_SESSION", { username });
                }, (err) => {
                    console.log(err);
                });
        },
        AUTH(context) {
            axios.get(url("auth"), { withCredentials: true }).then(resp => {
                context.commit("SET_SESSION", resp.data);
            }, err => {
                console.log(err);
            })
        }
    }

}