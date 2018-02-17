import Vue from "vue";
import api from "../api";

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
            return api.auth.newUser(username)
                .then(resp => {
                    commit("SET_SESSION", { username });
                }, (err) => {
                    console.log(err);
                });
        },
        AUTH(context) {
            return api.auth.auth().then(resp => {
                context.commit("SET_SESSION", resp.data);
            }, err => {
                console.log(err);
            })
        }
    }

}