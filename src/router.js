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
  console.log(store.getters["Session/username"]);
  if (api.initialized) {
    next();
    // api.auth
    //     .auth()
    //     .then(sessData => {
    //         store.commit("Session/SET_SESSION", sessData);
    //         next("/party");
    //     })
    //     .catch(() => {
    //         next();
    //     });
  } else {
    next();
  }
};

const authGuard = (to, from, next) => {
  if (store.getters["Session/username"]) {
    return next();
  } else if (api.initialized) {
    return api.auth
      .auth()
      .then((sessData) => {
        store.commit("Session/SET_SESSION", sessData);
        return next();
      })
      .catch(() => next("/"));
  } else {
    return next("/");
  }
};

const testauthGuard = (to, from, next) => {
  if (store.getters["Session/username"]) {
    return next();
  } else if (api.initialized) {
    return api.auth
      .auth()
      .then((sessData) => {
        store.commit("Session/SET_SESSION", sessData);
        return next();
      })
      .catch(() => next());
  }

  return next();
};

const routes = [
  {
    path: "/",
    name: "welcome",
    component: Welcome,
    beforeEnter: nonauthGuard,
    meta: {
      title: "Snoppify",
    },
  },
  {
    path: "/party",
    name: "home",
    beforeEnter: authGuard,
    component: Home,
    meta: {
      title: "Snoppify",
    },
  },
  {
    path: "/track/:id",
    name: "track",
    component: Track,
    beforeEnter: authGuard,
    props: true,
    meta: {
      title: "Snoppify",
    },
  },
  {
    path: "/new-user",
    name: "newUser",
    component: NewUser,
    beforeEnter: nonauthGuard,
    meta: {
      title: "Snoppify - Join",
    },
  },
  {
    path: "/fp",
    name: "fingerprint",
    beforeEnter: authGuard,
    component: Fingerprint,
    meta: {
      title: "Snoppify",
    },
  },
  {
    path: "/host",
    name: "host",
    beforeEnter: testauthGuard,
    component: Host,
    meta: {
      title: "Snoppify - Host",
    },
  },
  {
    path: "*",
    beforeEnter: authGuard,
    component: NotFound,
    meta: {
      title: "Not found",
    },
  },
];

const router = new VueRouter({
  routes,
  mode: "history",
});

// FROM: https://alligator.io/vuejs/vue-router-modify-head/
// This callback runs before every route change, including on page load.
router.beforeEach((to, from, next) => {
  // This goes through the matched routes from last to first, finding the closest route with a title.
  // eg. if we have /some/deep/nested/route and /some, /deep, and /nested have titles, nested's will be chosen.
  const nearestWithTitle = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.title);

  // Find the nearest route element with meta tags.
  const nearestWithMeta = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.metaTags);
  const previousNearestWithMeta = from.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.metaTags);

  // If a route with a title was found, set the document (page) title to that value.
  if (nearestWithTitle) document.title = nearestWithTitle.meta.title;

  // Remove any stale meta tags from the document using the key attribute we set below.
  Array.from(document.querySelectorAll("[data-vue-router-controlled]")).map(
    (el) => el.parentNode.removeChild(el),
  );

  // Skip rendering meta tags if there are none.
  if (!nearestWithMeta) return next();

  // Turn the meta tag definitions into actual elements in the head.
  nearestWithMeta.meta.metaTags
    .map((tagDef) => {
      const tag = document.createElement("meta");

      Object.keys(tagDef).forEach((key) => {
        tag.setAttribute(key, tagDef[key]);
      });

      // We use this to track which meta tags we create, so we don't interfere with other ones.
      tag.setAttribute("data-vue-router-controlled", "");

      return tag;
    })
    // Add the meta tags to the document head.
    .forEach((tag) => document.head.appendChild(tag));

  next();
});

export default router;
