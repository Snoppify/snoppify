import spotifyAPI from "./spotify-api";
import spotifyPlaybackApi from "./spotify-playback-api";
import spotifyController from "./spotify-controller";
import { Request } from "express";

const spotify = {
    api: spotifyAPI,
    playbackAPI: spotifyPlaybackApi,
    controller: spotifyController,
    init: (req: Request) => {
        spotify.api.init();
        spotify.controller.init();
    },
};

export default spotify;
