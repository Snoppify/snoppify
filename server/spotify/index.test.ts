import { createSnoppifyHost, getSnoppifyHost } from ".";
import User from "../models/User/User";
import { SpotifyController } from "./spotify-controller";
import SpotifyPlaybackAPI from "./spotify-playback-api";

jest.mock("./spotify-controller");
jest.mock("./spotify-api");
jest.mock("./spotify-playback-api");

describe("Spotify index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a snoppify host", () => {
    const host = createSnoppifyHost({
      accessToken: "ACCESS_TOKEN",
      owner: ownerUser(),
      refreshToken: "REFRESH_TOKEN",
    });

    expect(SpotifyController).toHaveBeenCalledTimes(1);
    expect(SpotifyPlaybackAPI).toHaveBeenCalled();
    expect(SpotifyController).toHaveBeenCalled();

    expect(host).not.toBeNull();
  });

  it("should get host by hostId", () => {
    const host1 = createSnoppifyHost({
      accessToken: "ACCESS_TOKEN",
      owner: ownerUser(),
      refreshToken: "REFRESH_TOKEN",
    });

    const host2 = createSnoppifyHost({
      accessToken: "ACCESS_TOKEN",
      owner: ownerUser(),
      refreshToken: "REFRESH_TOKEN",
    });

    const getHost1 = getSnoppifyHost("HOST_1");
    const getHost2 = getSnoppifyHost("HOST_2");

    expect(host1).toEqual(getHost1);
    expect(host2).toEqual(getHost2);
  });
});

function ownerUser() {
  return new User({
    id: "lol",
    displayName: "test",
    name: "lol",
    username: "testfakelol",
  });
}
