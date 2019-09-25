import { Request } from "express";

import spotifyAPI from "./spotify-api";
import spotifyController from "./spotify-controller";
import spotifyPlaybackApi = require("./spotify-playback-api");

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
};

export default spotify;
