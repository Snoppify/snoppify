import { Request } from "express";

import spotifyAPI, { SpotifyAPI } from "./spotify-api";
import spotifyController from "./spotify-controller";
import spotifyPlaybackApi = require("./spotify-playback-api");

export type Spotify = {
    initialized: boolean;
    api: SpotifyAPI;
    playbackAPI: any;
    controller: any;
    init: (req: Request) => void;
};

const spotify = {
    initialized: false,
    api: spotifyAPI,
    playbackAPI: spotifyPlaybackApi,
    controller: spotifyController,
    init: (req: Request) => {
        spotify.initialized = true;
        spotify.api.init();
        spotify.playbackAPI.init(spotify.api);
        spotify.controller.init(spotify.api);
    },
} as Spotify;

export default spotify;
