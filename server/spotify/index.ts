import { Request } from "express";

import { createSpotifyAPI, SpotifyAPI } from "./spotify-api";
import { SpotifyController } from "./spotify-controller";
import { SpotifyPlaybackAPI } from "./spotify-playback-api";

export type SnoppifyHost = {
    initialized: boolean;
    api: SpotifyAPI;
    playbackAPI: SpotifyPlaybackAPI;
    controller: SpotifyController;
};

export { createSnoppifyHost, getSnoppifyHost };


const activeHosts: {
    [hostId: string]: SnoppifyHost;
} = {};

const createSnoppifyHost = (opts: {
    owner: string;
    accessToken: string;
    refreshToken: string;
    hostId: string;
}) => {
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

    return host;
}

const getSnoppifyHost = (id: string) => {
    return activeHosts[id];
}

