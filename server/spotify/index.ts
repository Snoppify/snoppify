import { Request as ExpressRequest } from "express";
import User from "../models/User/User";
import { createSpotifyAPIUserClient, SpotifyAPI } from "./spotify-api";
import { SpotifyController } from "./spotify-controller";
import { SpotifyPlaybackAPI } from "./spotify-playback-api";

export type SnoppifyHost = {
  initialized: boolean;
  api: SpotifyAPI;
  playbackAPI: SpotifyPlaybackAPI;
  controller: SpotifyController;
};

export {
  authenticateSpotifyHost,
  createSnoppifyHost,
  createSpotifyHost,
  getSnoppifyHost,
  getSnoppifyHostForUser,
};

export const GLOBAL_SNOPPIFY_HOST_ID = "GLOBAL_HOST_ID";

const activeHosts: {
  [hostId: string]: SnoppifyHost;
} = {};

const createSnoppifyHost = (opts: {
  owner: string;
  accessToken: string;
  refreshToken: string;
  hostId: string;
}) => {
  const api = createSpotifyAPIUserClient({
    accessToken: opts.accessToken,
    refreshToken: opts.refreshToken,
  });

  api.config.owner = opts.owner;

  const playbackAPI = new SpotifyPlaybackAPI(api);
  const controller = new SpotifyController({ api, playbackAPI });

  const host = {
    initialized: true,
    api,
    playbackAPI,
    controller,
  } as SnoppifyHost;

  activeHosts[opts.hostId] = host;

  return host;
};

const getSnoppifyHost = (id: string) => activeHosts[id];
const getSnoppifyHostForUser = (user: ExpressRequest["user"]) =>
  getSnoppifyHost(user?.partyId || user?.id);

/**
 * Throws an error if the provided param is not a string. Used for
 * checking/asserting the type of e.g. parsed querystrings.
 * @param str
 */
const checkStr = (str: any) => {
  if (typeof str === "string") return str;
  throw new Error(`Not a string: ${JSON.stringify(str)}`);
};

const authenticateSpotifyHost = (incomingUser: any) =>
  new Promise<void>((resolve) => {
    const user = { ...incomingUser };

    const { access_token } = user._tokens;
    const { refresh_token } = user._tokens;

    user.host = user.host || {};

    user.host.status = "success";

    const snoppifyHost = createSnoppifyHost({
      owner: user.username,
      accessToken: checkStr(access_token),
      refreshToken: checkStr(refresh_token),
      hostId: user.host.id || user.id,
    });

    User.save(user, () => {
      if (user.host.id) {
        snoppifyHost.controller
          .setParty(user.host)
          .then(() => {
            resolve();
          })
          .catch((r) => {
            console.log(r);

            // Bad party, remove
            // TODO: better party handling
            // delete req.user.host.id;
            // delete req.user.host.name;

            resolve();
          });
      } else {
        // no party created
        resolve();
      }
    });
  });

const createSpotifyHost = (incomingUser: any) =>
  new Promise<void>((resolve, reject) => {
    const user = { ...incomingUser };

    const { access_token } = user._tokens;
    const { refresh_token } = user._tokens;

    // create host object
    const id = Date.now().toString(); // just some fake id for now
    const hostData = {
      status: "success",
      id,
      // TODO
      // ip: ip.address(),
      // hostCode: codeWords.getCode(ip.address()),
      name: `Snoppify ${id}`,
      playlist: null,
    };
    if (!user.host) {
      user.host = {};
    }
    for (const key of Object.keys(hostData)) {
      user.host[key] = hostData[key];
    }

    if (!user.parties) {
      user.parties = [];
    }
    user.parties.push({
      id,
      name: hostData.name,
    });

    user.partyId = id;

    User.save(user, () => {
      const snoppifyHost = createSnoppifyHost({
        owner: user.username,
        accessToken: checkStr(access_token),
        refreshToken: checkStr(refresh_token),
        hostId: id,
      });

      snoppifyHost.controller
        .createMainPlaylist(hostData.name)
        .then((playlist) => {
          console.log("Created new host");

          snoppifyHost.controller
            .setParty(user.host, {
              mainPlaylist: playlist,
              backupPlaylist: null,
            })
            .then(() => {
              resolve();
            })
            .catch((r) => {
              console.log(r);
              reject(r);
            });
        })
        .catch((r) => {
          console.log(r);
          reject(r);
        });
    });
  });
