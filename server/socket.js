import { Server } from "socket.io";

// define the actual singleton instance
// ------------------------------------

const SOCKET_KEY = Symbol("socket.io");
const SOCKET_SOCKETS_KEY = Symbol("socket.io-sockets");

global[SOCKET_KEY] = null;
global[SOCKET_SOCKETS_KEY] = {};

// define the singleton API
// ------------------------

const singleton = function socket(http) {
  global[SOCKET_KEY] = new Server(http, {
    cors: {
      origin: process.env.CLIENT_URI,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  return singleton;
};

Object.defineProperty(singleton, "io", {
  get() {
    return global[SOCKET_KEY];
  },
});

Object.defineProperty(singleton, "sockets", {
  get() {
    return global[SOCKET_SOCKETS_KEY];
  },
});

// ensure the API is never changed
// -------------------------------

Object.freeze(singleton);

// export the singleton API only
// -----------------------------

export default singleton;
