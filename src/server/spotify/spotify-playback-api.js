let axios = require("axios");

let spotifyApi = require("./spotify-api");

const authToken = new Buffer(process.env.JOHN_CLIENT_ID + ":" + process.env.JOHN_CLIENT_SECRET).toString('base64');
const refreshToken = "AQDrSwsvDhyo460XLGy4dm8A2dS_PHhpOwDCShwfqgd0jyOS6N412AQ10g-gfQyW10wkfIF4F03lUekwDbgUzt9miV6hPujbgQYkljL0UX1KEMwTXSVObFX65vSFiMUfBJc";

let accessToken = null;
let refreshTime = 0;
let expireTime = 3600 / 2;

module.exports = {
    play,
    pause,
    stop,
    next,
    previous,
    addToPlaylist,
    currentlyPlaying,
};

function play(opts) {
    let data = {};
    if (opts.playlist) {
        data.context_uri = "spotify:user:johnbrynte:playlist:" + opts.playlist;
    }
    if (typeof opts.position != "undefined") {
        data.offset = {
            position: opts.position,
        };
    }
    return request("put", "me/player/play", data);
}

function pause() {
    return request("post", "me/player/pause");
}

function stop() {
    return request("post", "me/player/stop");
}

function next() {
    return request("post", "me/player/next");
}

function previous() {
    return request("post", "me/player/previous");
}

function addToPlaylist(owner, playlist, tracks) {
    return request("post", "users/" + owner + "/playlists/" + playlist + "/tracks", null, {
        uris: tracks.toString()
    });
}

function currentlyPlaying() {
    return request("get", "me/player");
}

///////////////////////

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
}

function getAccessToken() {
    return new Promise(function(resolve, reject) {;
        let time = (Date.now() - refreshTime) / 1000;
        if (time < expireTime) {
            resolve(accessToken);
        } else {
            axios({
                    method: "post",
                    url: "https://accounts.spotify.com/api/token",
                    params: {
                        grant_type: 'refresh_token', // client_credentials, authorization_code or refresh_token
                        refresh_token: refreshToken,
                        redirect_uri: 'http://localhost:3000',
                    },
                    headers: {
                        'Authorization': 'Basic ' + authToken,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                })
                .then(function(r) {
                    accessToken = r.data.access_token;
                    resolve(accessToken);
                })
                .catch(function(r) {
                    reject(r);
                });
        }
    });
}

function request(method, uri, data, params) {
    return new Promise(function(resolve, reject) {
        getAccessToken().then(function(token) {
            axios({
                method: method,
                url: 'https://api.spotify.com/v1/' + uri,
                timeout: 1000,
                headers: {
                    'Authorization': "Bearer " + token
                },
                data: data,
                params: params,
            }).then(resolve, reject);
        });
    });
}