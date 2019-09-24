import { Request } from "express";

import spotifyAPI from "./spotify-api";
import spotifyController from "./spotify-controller";
import spotifyPlaybackApi = require("./spotify-playback-api");

const spotify = {
    api: spotifyAPI,
    playbackAPI: spotifyPlaybackApi,
    controller: spotifyController,
    init: (req: Request) => {
        spotify.api.init();
        spotify.controller.init(spotify.api);
    },
};

export default spotify;
