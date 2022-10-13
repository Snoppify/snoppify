import { Queue } from "../models/Queue/Queue";
import User from "../models/User/User";
import { createSpotifyAPIUserClient } from "./spotify-api";
import { SpotifyController } from "./spotify-controller";
import SpotifyPlaybackAPI from "./spotify-playback-api";
import { SpotifyWebApiMocks } from "./__mocks__/spotify-web-api-node";

jest.mock("spotify-web-api-node");

// For the SpotifyApi token refresh interval
jest.useFakeTimers();

describe("SpotifyController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates new parties from scratch", async () => {
    const spotifyApi = createSpotifyAPIUserClient({
      accessToken: "test",
      refreshToken: "test",
    });

    const controller = new SpotifyController({
      api: spotifyApi,
      playbackAPI: new SpotifyPlaybackAPI(spotifyApi),
    });

    const newParty = await controller.createNewParty({
      hostUser: new User({ id: "testUser" } as any),
    });

    // has mainPlaylistId
    expect(typeof newParty.mainPlaylistId).toBe("string");
    expect(SpotifyWebApiMocks.createPlaylist).toHaveBeenCalledWith(
      newParty.name,
      { public: true },
    );

    // has Queue
    expect(newParty.queue).toBeInstanceOf(Queue);

    // has id and name?
    expect(typeof newParty.id).toBe("string");
    expect(newParty.name).toBe(`Snoppify ${newParty.id}`);

    expect(newParty.hostUser).toBeInstanceOf(User);
  });
});
