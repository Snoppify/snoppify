import Vue from "vue";
import VueRouter from "vue-router";

import { store } from "./store";
import api from "./api";

// components
import Home from "./components/Home";
import Track from "./components/Track";
import NewUser from "./components/NewUser";
import Fingerprint from "./components/Fingerprint";
import NotFound from "./components/NotFound";
import Welcome from "./components/Welcome";
import Host from "./components/Host";

Vue.use(VueRouter);

/**
 * Only allows pages to be visited if the user can not be authed.
 * Otherwise redirects to "/"
 */
const nonauthGuard = (to, from, next) => {
    if (api.initialized) {
        api.auth
            .auth()
            .then(sessData => {
                store.commit("Session/SET_SESSION", sessData);
                next("/");
            })
            .catch(() => {
                next();
            });
    } else {
        next();
    }
};

const authGuard = (to, from, next) => {
    if (store.getters["Session/username"]) {
        return next();
    } else {
        api.initialized &&
            api.auth
                .auth()
                .then(sessData => {
                    store.commit("Session/SET_SESSION", sessData);
                    return next();
                })
                .catch(() => {
                    return next("/welcome");
                });

        return next("/welcome");
    }
};

const routes = [
    {
        path: "/welcome",
        name: "welcome",
        component: Welcome,
        beforeEnter: nonauthGuard,
    },
    {
        path: "/",
        name: "home",
        beforeEnter: authGuard,
        component: Home,
    },
    {
        path: "/track/:id",
        name: "track",
        component: Track,
        beforeEnter: authGuard,
        props: true,
    },
    {
        path: "/new-user",
        name: "newUser",
        component: NewUser,
        beforeEnter: nonauthGuard,
    },
    {
        path: "/fp",
        name: "fingerprint",
        beforeEnter: authGuard,
        component: Fingerprint,
    },
    {
        path: "/host",
        name: "host",
        component: Host,
    },
    {
        path: "*",
        beforeEnter: authGuard,
        component: NotFound,
    },
];

const router = new VueRouter({
    routes,
    mode: "history",
});

export default router;
