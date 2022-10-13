import {
  clearActiveHosts,
  createSpotifyHost,
  createSpotifyHostWithParty,
  getSnoppifyHost,
} from ".";
import User from "../models/User/User";
import { userService } from "../models/User/UserService";
import { SpotifyController } from "./spotify-controller";
import SpotifyPlaybackAPI from "./spotify-playback-api";
// IT'S DEFAUlt nw11

jest.mock("spotify-web-api-node");
jest.mock("../models/User/UserService");
jest.mock("../models/Party/PartyService");

// For the SpotifyApi token refresh interval
jest.useFakeTimers();

describe("Spotify index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearActiveHosts();
  });

  it("should create a spotify host", async () => {
    const userServiceSpy = jest.spyOn(userService, "upsave");

    const host = await createSpotifyHostWithParty(ownerUser());

    expect(host.controller).toBeInstanceOf(SpotifyController);
    expect(host.playbackAPI).toBeInstanceOf(SpotifyPlaybackAPI);

    expect(userServiceSpy).toBeCalledWith(
      expect.objectContaining({
        parties: [
          {
            id: host.controller.getParty().id,
            name: host.controller.getParty().name,
          },
        ],
        partyId: host.controller.getParty().id,
      }),
    );
  });

  it("should get host by host user party id", async () => {
    const owner = ownerUser();

    const host = await createSpotifyHostWithParty(owner);

    owner.partyId = host.controller.getParty().id;

    const getHost = getSnoppifyHost(owner);

    expect(getHost).toEqual(host);
  });

  it("should get host by host user id", async () => {
    const owner = ownerUser();

    const host = await createSpotifyHostWithParty(owner);

    const getHost = getSnoppifyHost(owner);

    expect(getHost).toEqual(host);
  });

  it("should return undefined if no host found", () => {
    expect(getSnoppifyHost(undefined)).toEqual(undefined);
    expect(getSnoppifyHost("noexist")).toEqual(undefined);
    expect(getSnoppifyHost(ownerUser())).toEqual(undefined);
  });

  it("should create a new spotify host", async () => {
    const userServiceSpy = jest.spyOn(userService, "upsave");

    const owner = ownerUser();

    const host = await createSpotifyHost(owner);

    expect(userServiceSpy).toBeCalledWith(
      expect.objectContaining({
        id: owner.id,
        host: { status: "success" },
      }),
    );

    const getHost = getSnoppifyHost(owner);
    expect(getHost).toEqual(host);
  });
});

function ownerUser() {
  return new User({
    id: "lol",
    displayName: "test",
    name: "lol",
    username: "testfakelol",
    _tokens: { access_token: "access_token", refresh_token: "refresh_token" },
  });
}
