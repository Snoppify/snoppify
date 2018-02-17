import VueRouter from 'vue-router'
import Vue from 'vue'

import { store } from './store'
import api from "./api";

// components
import Home from './components/Home'
import Vote from './components/Vote'
import NewUser from "./components/NewUser"
import Fingerprint from "./components/Fingerprint"
import NotFound from './components/NotFound'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'home',
    component: Home
}, {
    path: '/vote/:id',
    name: 'vote',
    component: Vote,
    props: true,
}, {
    path: "/new-user",
    name: "newUser",
    component: NewUser,
}, {
    path: "/fp",
    name: "fingerprint",
    component: Fingerprint,
}, {
    path: '*',
    component: NotFound
}]

const router = new VueRouter({
    routes,
    mode: 'history',
});

router.beforeEach((to, from, next) => {
    if (to.name === "newUser") {
        return next();
    }

    if (store.getters["Session/username"]) {
        return next();
    }
    else {
        api.auth.auth().then(sessData => {
            store.commit("Session/SET_SESSION", sessData);
            return next();
        }).catch(() => {
            return next("/new-user");
        })
    }
});

export default router;