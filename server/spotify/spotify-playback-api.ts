import { SpotifyAPI } from "./spotify-api";

let axios = require("axios");

const scopes = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-library-read",
    "user-library-modify",
    "user-read-private",
    "user-read-birthdate",
    "user-read-email",
    "user-follow-read",
    "user-follow-modify",
    "user-top-read",
    "user-read-recently-played",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
];

let accessToken = null;
let refreshTime = 0;
let expireTime = 3600 / 2;
let api: SpotifyAPI;

export default {
    init,
    scopes,
    getRefreshToken,
    getAuthUrl,
    play,
    pause,
    next,
    previous,
    addToPlaylist,
    currentlyPlaying,
    removePositionsFromPlaylist,
    setActiveDevice,
    getDevices,
};

function init(_api: SpotifyAPI) {
    api = _api;
}

interface PlayOptions {
    playlist?: any;
    position?: any;
    offset?: any;
    uris?: any;
}

function play(opts: PlayOptions = {}) {
    let data: Parameters<SpotifyAPI["play"]>[0] = {};
    if (opts.playlist) {
        data.context_uri = "spotify:playlist:" + opts.playlist;
    }
    if (typeof opts.uris != "undefined") {
        data.uris = opts.position;
    }
    if (typeof opts.position != "undefined") {
        data.offset = {
            position: opts.position,
        };
    }

    return api.play(data);
}

function pause() {
    return api.pause();
}

function next() {
    return api.skipToNext();
}

function previous() {
    return api.skipToPrevious();
}

function addToPlaylist(owner, playlist: string, tracks: string[]) {
    return api.addTracksToPlaylist(playlist, tracks);

    // return request(
    //     "post",
    //     "users/" + owner + "/playlists/" + playlist + "/tracks",
    //     null,
    //     {
    //         uris: tracks.toString(),
    //     },
    // );
}

function removePositionsFromPlaylist(
    owner,
    playlist: string,
    positions: number[],
    snapshot: string,
) {
    return api.removeTracksFromPlaylistByPosition(
        playlist,
        positions,
        snapshot,
    );
}

function currentlyPlaying() {
    // I think this is correct
    return api.getMyCurrentPlayingTrack().then(r => r.body);

    // return request("get", "me/player");
}

function setActiveDevice(id: string) {
    // cant find a suitable method in api
    return request("put", "me/player", {
        device_ids: [id],
    });
}

function getDevices() {
    return api.getMyDevices();
}

///////////////////////

function getAccessToken() {
    return new Promise(function(resolve, reject) {
        let time = (Date.now() - refreshTime) / 1000;
        if (accessToken && time < expireTime) {
            resolve(accessToken);
        } else {
            return api.refreshAccessToken().then(function(data) {
                accessToken = data.body.access_token;
                // Save the access token so that it's used in future calls
                api.setAccessToken(accessToken);
                resolve(accessToken);
            }, reject);
        }
    });
}

function getRefreshToken(code): Promise<string> {
    return Promise.resolve(api.getRefreshToken());
    
    return new Promise(function(resolve, reject) {
        axios({
            method: "post",
            url: "https://accounts.spotify.com/api/token",
            params: {
                grant_type: "authorization_code", // client_credentials, authorization_code or refresh_token
                code: code,
                redirect_uri: "http://localhost:3000/create-spotify-host",
            },
            headers: {
                Authorization: "Basic " + api.config.auth_token,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }).then(
            function(r) {
                if (r.data && r.data.refresh_token) {
                    resolve(r.data.refresh_token);
                } else {
                    resolve();
                }
            },
            function(r) {
                reject(r);
            },
        );
    });
}

function getAuthUrl(state?, redirectUri?) {
    // Does this work?
    (api as any)._credentials.redirectUri =
        redirectUri || "http://localhost:3000/create-spotify-host";

    return api.createAuthorizeURL(scopes, state || "auth");
}

function request(method, uri, data, params?) {
    return new Promise(function(resolve, reject) {
        getAccessToken().then(function(token) {
            axios({
                method: method,
                url: "https://api.spotify.com/v1/" + uri,
                timeout: 10000,
                headers: {
                    Authorization: "Bearer " + token,
                },
                data: data,
                params: params,
            }).then(function(data) {
                resolve(data.data);
            }, reject);
        }, reject);
    });
}
