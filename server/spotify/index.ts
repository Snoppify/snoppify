import { Request as ExpressRequest } from "express";
import User from "../models/User/User";
import { userService } from "../models/User/UserService";
import { createSpotifyAPIUserClient, SpotifyAPI } from "./spotify-api";
import { SpotifyController } from "./spotify-controller";
import SpotifyPlaybackAPI from "./spotify-playback-api";

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
  [hostUserId: string]: SnoppifyHost;
} = {};

const createSnoppifyHost = (opts: {
  owner: User;
  accessToken: string;
  refreshToken: string;
}) => {
  const api = createSpotifyAPIUserClient({
    accessToken: opts.accessToken,
    refreshToken: opts.refreshToken,
  });

  api.config.owner = opts.owner.username;

  const playbackAPI = new SpotifyPlaybackAPI(api);
  const controller = new SpotifyController({ api, playbackAPI });

  const host = {
    initialized: true,
    api,
    playbackAPI,
    controller,
  } as SnoppifyHost;

  activeHosts[opts.owner.id] = host;

  return host;
};

const getSnoppifyHost = (id: string) => activeHosts[id];
const getSnoppifyHostForUser = (user: ExpressRequest["user"]) =>
  getSnoppifyHost(user.id);

/**
 * Throws an error if the provided param is not a string. Used for
 * checking/asserting the type of e.g. parsed querystrings.
 * @param str
 */
const checkStr = (str: any) => {
  if (typeof str === "string") return str;
  throw new Error(`Not a string: ${JSON.stringify(str)}`);
};

const authenticateSpotifyHost = (incomingUser: User) =>
  new Promise<void>((resolve) => {
    const user = { ...incomingUser };

    console.log({ user, parties: user.parties });

    const { access_token } = user._tokens;
    const { refresh_token } = user._tokens;

    user.host = user.host || {};

    user.host.status = "success";

    const snoppifyHost = createSnoppifyHost({
      owner: user,
      accessToken: checkStr(access_token),
      refreshToken: checkStr(refresh_token),
    });

    userService.upsave(user).then(() => {
      // TODO: wrong id? broken?
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

const createSpotifyHost = async (incomingUser: User): Promise<void> => {
  const user = { ...incomingUser };

  console.log({ user });

  const { access_token } = user._tokens;
  const { refresh_token } = user._tokens;

  const snoppifyHost = createSnoppifyHost({
    owner: user,
    accessToken: checkStr(access_token),
    refreshToken: checkStr(refresh_token),
  });

  const newParty = await snoppifyHost.controller.createNewParty({
    hostUser: user,
  });

  // TODO: init party here or in controller?

  user.host = { ...user.host, status: "success" };

  if (!user.parties) {
    user.parties = [];
  }
  user.parties.push({
    id: newParty.id,
    name: newParty.name,
  });

  user.partyId = newParty.id;

  await userService.upsave(user);
};
