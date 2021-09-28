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
    let config = {} as ISnoppifyConfig;

    if (globalSpotifyAPI) {
        return globalSpotifyAPI;
    }

    try {
        config = require(appRoot + "/snoppify-config.js");

        if (config.client_id && config.client_secret) {
            config.auth_token = new Buffer(
                config.client_id + ":" + config.client_secret,
            ).toString("base64");
        }
    } catch (ex) {
        throw new Error("No snoppify config file");
    }

    const api = new SpotifyWebApi({
        redirectUri: "http://localhost:3000/create-spotify-host",
        clientId: config.client_id,
        clientSecret: config.client_secret,
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
