import Vue from "vue";
import api from "../api";

export default {
    namespaced: true,

    state: {
        user: {},
        username: "",
    },

    getters: {
        user: state => state.user,
        username: state => state.username,
    },

    mutations: {
        SET_SESSION: (state, sessionData) => {
            Object.assign(state.user, sessionData);
            state.username = sessionData.username;
        },
    },

    actions: {
        CREATE_SESSION({
            commit
        }, username) {
            return api.auth.newUser(username)
                .then(resp => {
                    commit("SET_SESSION", {
                        username
                    });
                }, (err) => {
                    console.log(err);
                });
        },
        AUTH(context) {
            return api.auth.auth().then(sessionData => {
                context.commit("SET_SESSION", sessionData);
            }, err => {
                console.log(err);
            })
        }
    }
}