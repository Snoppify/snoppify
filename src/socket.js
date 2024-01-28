import io from "socket.io-client";
import { store } from "./store";

export const socket = io(process.env.VUE_APP_SERVER_URI);

const modules = Object.keys(store._modules.root._children);

socket.on("connect", () => {
  store.commit("setSocket", socket);
});

socket.on("disconnect", () => {
  store.commit("setSocket", null);
});

socket.onAny((eventName, event) => {
  modules.forEach((module) => {
    const eventKey = `${module}/SOCKET_${eventName.toUpperCase()}`;
    if (eventKey in store._actions) {
      store.dispatch(eventKey, event);
    }
    if (eventKey in store._mutations) {
      store.commit(eventKey, event);
    }
  });
});
