import { Request } from "express";
import SpotifyWebApi from "spotify-web-api-node";

import { createSpotifyAPI, SpotifyAPI } from "./spotify-api";
import { SpotifyController } from "./spotify-controller";
import { SpotifyPlaybackAPI } from "./spotify-playback-api";
import User from "./../models/user";

export type SnoppifyHost = {
    initialized: boolean;
    api: SpotifyAPI;
    playbackAPI: SpotifyPlaybackAPI;
    controller: SpotifyController;
};

export {
    createSnoppifyHost,
    getSnoppifyHost,
    getLatestSnoppifyHost,
    authenticateSpotifyHost,
    createSpotifyHost,
};

let latestHost: SnoppifyHost = null as any;

const activeHosts: {
    [hostId: string]: SnoppifyHost;
} = {};

const spotifyAPI = new SpotifyWebApi({
    redirectUri: process.env.SERVER_URI + "/auth/spotify/callback",
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
}) as SpotifyAPI;

const createSnoppifyHost = (opts: {
    owner: string;
    accessToken: string;
    refreshToken: string;
    hostId: string;
}) => {
    // if (latestHost) return latestHost;

    const api = createSpotifyAPI();

    // Set the access token on the API object to use it in later calls
    api.config.owner = opts.owner;
    api.setAccessToken(opts.accessToken);
    api.setRefreshToken(opts.refreshToken);

    api.init();

    const playbackAPI = new SpotifyPlaybackAPI(api);
    const controller = new SpotifyController({ api, playbackAPI });

    const host = {
        initialized: true,
        api,
        playbackAPI,
        controller
    } as SnoppifyHost;

    activeHosts[opts.hostId] = host;
    latestHost = host;

    return host;
}

const getSnoppifyHost = (id: string) => {
    // return activeHosts[id];
    return getLatestSnoppifyHost();
}

/**
 * returns the latest created host
 * 
 * OBS!!! VÄLDIGT FULHACK!!!
 */
const getLatestSnoppifyHost = () => latestHost

/**
 * Throws an error if the provided param is not a string. Used for
 * checking/asserting the type of e.g. parsed querystrings.
 * @param str 
 */
const checkStr = (str: any) => {
    if (typeof str === "string") return str;
    throw new Error("Not a string: " + JSON.stringify(str));
};

const authenticateSpotifyHost = (user: any) => {
    return new Promise<void>((resolve, reject) => {

        const access_token = user._tokens.access_token;
        const refresh_token = user._tokens.refresh_token;

        user.host = user.host || {};

        user.host.status = 'success';

        const snoppifyHost = createSnoppifyHost({
            owner: user.username,
            accessToken: checkStr(access_token),
            refreshToken: checkStr(refresh_token),
            hostId: "default", // this is a hack
        });

        User.save(user, () => {
            if (user.host.id) {
                snoppifyHost.controller.setParty(user.host)
                    .then(() => {
                        resolve();
                    }).catch(r => {
                        console.log(r);

                        // Bad party, remove
                        // TODO: better party handling
                        // delete req.user.host.id;
                        // delete req.user.host.name;

                        resolve();
                    });
            } else {
                // no party created
                resolve();
            }
        });
    });
}

const createSpotifyHost = (user: any) => {
    return new Promise<void>((resolve, reject) => {
        const access_token = user._tokens.access_token;
        const refresh_token = user._tokens.refresh_token;

        // create host object
        var id = Date.now().toString(); // just some fake id for now
        var hostData = {
            status: 'success',
            id: id,
            // TODO
            // ip: ip.address(),
            // hostCode: codeWords.getCode(ip.address()),
            name: "Snoppify " + id,
            playlist: null,
        };
        if (!user.host) {
            user.host = {};
        }
        for (var key in hostData) {
            user.host[key] = hostData[key];
        }

        if (!user.parties) {
            user.parties = [];
        }
        user.parties.push({
            id: id,
            name: hostData.name,
        });

        user.partyId = id;

        User.save(user, () => {
            const snoppifyHost = createSnoppifyHost({
                owner: user.username,
                accessToken: checkStr(access_token),
                refreshToken: checkStr(refresh_token),
                hostId: id,
            });

            snoppifyHost.controller
                .createMainPlaylist(hostData.name)
                .then(function (playlist) {
                    console.log("Created new host");

                    snoppifyHost.controller.setParty(user.host, {
                        mainPlaylist: playlist,
                        backupPlaylist: null,
                    }).then(() => {
                        resolve();
                    }).catch(r => {
                        console.log(r);
                        reject(r);
                    });
                })
                .catch(function (r) {
                    console.log(r);
                    reject(r);
                });
        });
    });
}