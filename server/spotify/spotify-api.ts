import appRoot from "app-root-path";
import SpotifyWebApi from "spotify-web-api-node";

import { ISnoppifyConfig } from "./snoppify-config.interface";

export type SpotifyAPI = SpotifyWebApi & {
    init: () => SpotifyAPI;
    config: ISnoppifyConfig;
    onload: Promise<any>;
};

let globalSpotifyAPI: SpotifyAPI;

function initAccessTokenRefreshInterval(api: SpotifyAPI) {
    setInterval(() => {
        api.refreshAccessToken().then(
            (data) => {
                console.log("Updated access_token:", data.body.access_token);
                // Save the access token so that it's used in future calls
                api.setAccessToken(data.body.access_token);
            },
            (err: any) => {
                console.log(
                    "Something went wrong when retrieving an access token",
                    err,
                );
            },
        );
    }, 60 * 10 * 1000); // every 15 min
}

export function createSpotifyAPI() {
    let config = {
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        
        auth_token: Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET,
        ).toString("base64"),
        refresh_token: "",
        
        owner: "",
        playlist: "",

        spotifyAuth: {
            clientID: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        },
        facebookAuth: {
            clientID: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        },
        googleAuth: {
            clientID: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        },
    } as ISnoppifyConfig;

    if (globalSpotifyAPI) {
        return globalSpotifyAPI;
    }

    const api = new SpotifyWebApi({
        redirectUri: process.env.SERVER_URI + "/auth/spotify/callback",
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    }) as SpotifyAPI;

    if (!globalSpotifyAPI) {
        globalSpotifyAPI = api;
    }

    api.config = config;

    api.init = () => {
        api.config = config;

        api.onload = new Promise<void>((resolve, reject) => {
            api.clientCredentialsGrant().then(
                (data: any) => {
                    // Save the access token so that it's used in future calls
                    api.setAccessToken(data.body["access_token"]);

                    initAccessTokenRefreshInterval(api);

                    resolve();
                },
                (err: any) => {
                    console.log(
                        "Something went wrong when retrieving an access token",
                        err,
                    );

                    reject();
                },
            );
        });

        // Make sure init only does things the first time it gets called?
        api.init = () => api
        return api;
    };

    return api;
}
