import appRoot from "app-root-path";
import SpotifyWebApi from "spotify-web-api-node";

import { ISnoppifyConfig } from "./snoppify-config.interface";

export type SpotifyAPI = SpotifyWebApi & {
    init: () => SpotifyAPI;
    config: ISnoppifyConfig;
    onload: Promise<any>;
};

function refreshAccessToken(api: SpotifyAPI) {
    setInterval(function() {
        api.clientCredentialsGrant().then(
            function(data: any) {
                console.log("Updated access_token:", data.body.access_token);
                // Save the access token so that it's used in future calls
                api.setAccessToken(data.body.access_token);
            },
            function(err: any) {
                console.log(
                    "Something went wrong when retrieving an access token",
                    err,
                );
            },
        );
    }, 3000 * 1000);
}

export function createSpotifyAPI() {
    let config = {} as ISnoppifyConfig;

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

    api.config = config;

    api.init = () => {
        api.config = config;

        api.onload = new Promise(function(resolve, reject) {
            api.clientCredentialsGrant().then(
                function(data: any) {
                    // Save the access token so that it's used in future calls
                    api.setAccessToken(data.body["access_token"]);

                    refreshAccessToken(api);

                    resolve();
                },
                function(err: any) {
                    console.log(
                        "Something went wrong when retrieving an access token",
                        err,
                    );

                    reject();
                },
            );
        });

        return api;
    };

    return api;
}
