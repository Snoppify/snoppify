const socketio = require('socket.io');

// define the actual singleton instance
// ------------------------------------

const SOCKET_KEY = Symbol("socket.io");
const SOCKET_SOCKETS_KEY = Symbol("socket.io-sockets");

global[SOCKET_KEY] = null;
global[SOCKET_SOCKETS_KEY] = {};

// define the singleton API
// ------------------------

var singleton = function socket(http) {
    global[SOCKET_KEY] = socketio(http);
    return singleton;
};

Object.defineProperty(singleton, "io", {
    get: function() {
        return global[SOCKET_KEY];
    }
});

Object.defineProperty(singleton, "sockets", {
    get: function() {
        return global[SOCKET_SOCKETS_KEY];
    }
});

// ensure the API is never changed
// -------------------------------

Object.freeze(singleton);

// export the singleton API only
// -----------------------------

module.exports = singleton;