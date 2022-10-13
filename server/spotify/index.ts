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

export { authenticateSpotifyHost, createSpotifyHost, getSnoppifyHost };

export const GLOBAL_SNOPPIFY_HOST_ID = "GLOBAL_HOST_ID";

const activeHosts: {
  [hostUserId: string]: SnoppifyHost;
} = {};

// TODO:  this needs a new name
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

  return host;
};

function getSnoppifyHost(partyId: string): SnoppifyHost;
function getSnoppifyHost(user: User): SnoppifyHost;
function getSnoppifyHost(userOrPartyId: string | User) {
  return typeof userOrPartyId === "string"
    ? activeHosts[userOrPartyId]
    : activeHosts[userOrPartyId.partyId];
}

/**
 * Throws an error if the provided param is not a string. Used for
 * checking/asserting the type of e.g. parsed querystrings.
 * @param str
 */
const checkStr = (str: any) => {
  if (typeof str === "string") return str;
  throw new Error(`Not a string: ${JSON.stringify(str)}`);
};

/** for host users with an (ongoing?) party */
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

// TODO:  this needs a new name
/** for host users with no (ongoing?) parties */
const createSpotifyHost = async (
  incomingUser: User,
): Promise<SnoppifyHost & { hostUser: User }> => {
  const user = { ...incomingUser };

  const { access_token, refresh_token } = user._tokens;

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
  activeHosts[newParty.id] = snoppifyHost;

  await userService.upsave(user);

  return { ...snoppifyHost, hostUser: user };
};
