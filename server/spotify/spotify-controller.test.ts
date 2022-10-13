import { PartyFull } from "../models/Party/Party";
import { partyService } from "../models/Party/PartyService";
import { Queue } from "../models/Queue/Queue";
import User from "../models/User/User";
import { StateMachine } from "../StateMachine";
import { createSpotifyAPIUserClient } from "./spotify-api";
import { SpotifyController } from "./spotify-controller";
import SpotifyPlaybackAPI from "./spotify-playback-api";
import { SpotifyWebApiMocks } from "./__mocks__/spotify-web-api-node";

jest.mock("./spotify-playback-api");
jest.mock("spotify-web-api-node");
jest.mock("../models/Party/PartyService");

// For the SpotifyApi token refresh interval
jest.useFakeTimers();

const mockedPartyService = jest.mocked(partyService);

describe("SpotifyController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates new parties from scratch", async () => {
    const controller = createController();

    const hostUser = new User({ id: "testUser" } as any);
    const newParty = await controller.createNewParty({ hostUser });

    expect(mockedPartyService.upsave).toHaveBeenCalledWith<[PartyFull]>({
      id: newParty.id,
      name: newParty.name,
      mainPlaylistId: newParty.mainPlaylistId,
      queue: expect.any(Queue),
      hostUser,
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

  it("starts/intializes new parties", async () => {
    const stateMachineSpy = jest.spyOn(StateMachine.prototype, "start");

    const controller = createController();

    const hostUser = new User({ id: "testUser" } as any);
    const newParty = await controller.createNewParty({ hostUser });

    expect(SpotifyWebApiMocks.getPlaylist).toBeCalledWith(
      newParty.mainPlaylistId,
    );

    expect(SpotifyWebApiMocks.getPlaylist).not.toBeCalledWith(
      newParty.backupPlaylistId,
    );

    expect(stateMachineSpy).toBeCalled();
  });
});

function createController() {
  const spotifyApi = createSpotifyAPIUserClient({
    accessToken: "test",
    refreshToken: "test",
  });

  const controller = new SpotifyController({
    api: spotifyApi,
    playbackAPI: new SpotifyPlaybackAPI(spotifyApi),
  });

  return controller;
}
