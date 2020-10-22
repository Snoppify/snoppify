import { Request } from "express";

import spotifyAPI, { SpotifyAPI } from "./spotify-api";
import spotifyController from "./spotify-controller";
import spotifyPlaybackApi from "./spotify-playback-api";

export type Spotify = {
    initialized: boolean;
    api: SpotifyAPI;
    playbackAPI: typeof spotifyPlaybackApi;
    controller: typeof spotifyController;
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
