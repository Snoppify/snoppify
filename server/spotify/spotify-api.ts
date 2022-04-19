import dotenv from "dotenv";
import SpotifyWebApi from "spotify-web-api-node";
import { ISnoppifyConfig } from "./snoppify-config.interface";

// @ts-ignore
dotenv.config();

export type SpotifyAPI = SpotifyWebApi & {
  init: () => SpotifyAPI;
  config: ISnoppifyConfig;
  onload: Promise<any>;
  /** Closes the api client */
  close: () => void;
};

let globalSpotifyAPI: SpotifyAPI;

function initAccessTokenRefreshInterval(api: SpotifyAPI) {
  const intervalId = setInterval(() => {
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

  return () => clearInterval(intervalId);
}

export function createSpotifyAPI() {
  const config = {
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,

    auth_token: Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
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
    redirectUri: `${process.env.SERVER_URI}/auth/spotify/callback`,
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
          api.setAccessToken(data.body.access_token);

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
    api.init = () => api;
    return api;
  };

  return api;
}

/**
 * Creates a spotify api instance for use on the backend server
 */
async function createBackendClient(): Promise<SpotifyAPI> {
  const api = new SpotifyWebApi({
    redirectUri: `${process.env.SERVER_URI}/auth/spotify/callback`,
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  }) as SpotifyAPI;

  const { body: grantResponse } = await api.clientCredentialsGrant();

  // Save the access token so that it's used in future calls
  api.setAccessToken(grantResponse.access_token);

  api.close = initAccessTokenRefreshInterval(api);
  api.config = {} as ISnoppifyConfig;

  return api;
}

/**
 * Creates a new spotify api instance with auth for a specific user,
 * i.e. the party host.
 */
export function createSpotifyAPIUserClient(opts: {
  accessToken: string;
  refreshToken: string;
}): SpotifyAPI {
  const api = new SpotifyWebApi({
    redirectUri: `${process.env.SERVER_URI}/auth/spotify/callback`,
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    accessToken: opts.accessToken,
    refreshToken: opts.refreshToken,
  }) as SpotifyAPI;

  api.close = initAccessTokenRefreshInterval(api);
  api.config = {} as ISnoppifyConfig;

  return api;
}

export const backendSpotifyAPIClient = createBackendClient();
