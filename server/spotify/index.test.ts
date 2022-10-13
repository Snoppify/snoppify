import { createSpotifyHost, getSnoppifyHost } from ".";
import User from "../models/User/User";
import { userService } from "../models/User/UserService";
import { SpotifyController } from "./spotify-controller";
import SpotifyPlaybackAPI from "./spotify-playback-api";
// IT'S DEFAUlt nw11

jest.mock("spotify-web-api-node");
jest.mock("../models/User/UserService");

// For the SpotifyApi token refresh interval
jest.useFakeTimers();

describe("Spotify index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a spotify host", async () => {
    const userServiceSpy = jest.spyOn(userService, "upsave");

    const host = await createSpotifyHost(ownerUser());

    expect(host.controller).toBeInstanceOf(SpotifyController);
    expect(host.playbackAPI).toBeInstanceOf(SpotifyPlaybackAPI);

    expect(userServiceSpy).toBeCalledWith(
      expect.objectContaining({
        parties: [
          {
            id: host.controller.getCurrentParty().id,
            name: host.controller.getCurrentParty().name,
          },
        ],
        partyId: host.controller.getCurrentParty().id,
      }),
    );
  });

  it("should get host by host user", async () => {
    const owner = ownerUser();

    const { hostUser, ...host } = await createSpotifyHost(owner);

    const getHost = getSnoppifyHost(hostUser);

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
