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

let refreshTime = 0;
let expireTime = 3600 / 2;

interface PlayOptions {
    playlist?: any;
    position?: any;
    offset?: any;
    uris?: any;
}

class SpotifyPlaybackAPI {
    private accessToken: string;
    private api: SpotifyAPI;

    constructor(api: SpotifyAPI) {
        this.api = api;
        this.accessToken = api.getAccessToken();
    }

    play(opts: PlayOptions = {}) {
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

        return this.api.play(data);
    }

    pause() {
        return this.api.pause();
    }

    next() {
        return this.api.skipToNext();
    }

    previous() {
        return this.api.skipToPrevious();
    }

    addToPlaylist(owner, playlist: string, tracks: string[]) {
        return this.api.addTracksToPlaylist(playlist, tracks);

        // return request(
        //     "post",
        //     "users/" + owner + "/playlists/" + playlist + "/tracks",
        //     null,
        //     {
        //         uris: tracks.toString(),
        //     },
        // );
    }

    removePositionsFromPlaylist(
        owner,
        playlist: string,
        positions: number[],
        snapshot: string,
    ) {
        return this.api.removeTracksFromPlaylistByPosition(
            playlist,
            positions,
            snapshot,
        );
    }

    currentlyPlaying() {
        // I think this is correct
        return this.api.getMyCurrentPlayingTrack().then(r => r.body);

        // return request("get", "me/player");
    }

    setActiveDevice(id: string) {
        // cant find a suitable method in api
        return this.request("put", "me/player", {
            device_ids: [id],
        });
    }

    getDevices() {
        return this.setAPITokens().then(() => {
            return this.api.getMyDevices().then(r => r.body);
        });
    }

    ///////////////////////

    getAccessToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            let time = (Date.now() - refreshTime) / 1000;

            // console.log("this.accestoken", this.accessToken, { time, expireTime })

            if (this.accessToken && time < expireTime) {
                resolve(this.accessToken);
            } else {
                return this.api.refreshAccessToken().then(data => {
                    this.accessToken = data.body.access_token;
                    // Save the access token so that it's used in future calls
                    this.api.setAccessToken(this.accessToken);
                    refreshTime = Date.now();
                    resolve(this.accessToken);
                }, reject);
            }
        });
    }

    getRefreshToken(code?): Promise<string> {
        return Promise.resolve(this.api.getRefreshToken());

        return new Promise<string | null>((resolve, reject) => {
            axios({
                method: "post",
                url: "https://accounts.spotify.com/api/token",
                params: {
                    grant_type: "authorization_code", // client_credentials, authorization_code or refresh_token
                    code: code,
                    redirect_uri: process.env.SERVER_URI + "/create-spotify-host",
                },
                headers: {
                    Authorization: "Basic " + this.api.config.auth_token,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }).then(
                r => {
                    if (r.data && r.data.refresh_token) {
                        resolve(r.data.refresh_token);
                    } else {
                        resolve(null);
                    }
                },
                r => {
                    reject(r);
                },
            );
        });
    }

    getAuthUrl(state?, redirectUri?) {
        // Does this work?
        (this.api as any)._credentials.redirectUri =
            redirectUri || process.env.SERVER_URI + "/create-spotify-host";

        return this.api.createAuthorizeURL(scopes, state || "auth");
    }

    private setAPITokens(): Promise<void> {
        return Promise.all([
            this.getRefreshToken(),
            this.getAccessToken(),
        ]).then(([refresh, access]) => {
            this.api.setAccessToken(access);
            this.api.setRefreshToken(refresh);
        });
    }

    private request(method, uri, data?, params?) {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then(token => {
                axios({
                    method: method,
                    url: "https://api.spotify.com/v1/" + uri,
                    timeout: 10000,
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                    data,
                    params,
                }).then(data => {
                    resolve(data.data);
                }, reject);
            }, reject);
        });
    }
}

export { SpotifyPlaybackAPI, scopes as spotifyAPIScopes };
