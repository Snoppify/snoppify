import User from "../models/User/User";
import { userService } from "../models/User/UserService";
import { logger } from "../utils/snoppify-logger";
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
  createSpotifyHost,
  createSpotifyHostWithParty,
  getSnoppifyHost,
  clearActiveHosts,
};

export const GLOBAL_SNOPPIFY_HOST_ID = "GLOBAL_HOST_ID";

let activeHosts: {
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
    : activeHosts[userOrPartyId?.partyId] || activeHosts[userOrPartyId?.id];
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

/** for host users with no (ongoing?) parties */
const createSpotifyHostWithParty = async (
  incomingUser: User,
): Promise<SnoppifyHost> => {
  const user = { ...incomingUser };

  logger.info("createSpotifyHost", user);

  const snoppifyHost = await createSpotifyHost(user);
  await createParty(user, snoppifyHost);

  return snoppifyHost;
};

/** for host users with an (ongoing?) party */
async function createSpotifyHost(incomingUser: User): Promise<SnoppifyHost> {
  const user = { ...incomingUser };

  logger.info("authenticateSpotifyHost", user);

  logger.info({ user, parties: user.parties });

  const { access_token, refresh_token } = user._tokens;

  user.host = user.host || {};

  user.host.status = "success";

  const snoppifyHost = createSnoppifyHost({
    owner: user,
    accessToken: checkStr(access_token),
    refreshToken: checkStr(refresh_token),
  });

  await userService.upsave(user);

  activeHosts[user.id] = snoppifyHost;

  // TODO: init existing/ongoing party here?

  return snoppifyHost;
}

async function createParty(
  incomingUser: User,
  snoppifyHost: SnoppifyHost,
): Promise<SnoppifyHost> {
  const user = { ...incomingUser };

  const newParty = await snoppifyHost.controller.createNewParty({
    hostUser: user,
  });

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

  return snoppifyHost;
}

/** mainly for testing */
const clearActiveHosts = () => {
  activeHosts = {};
};
