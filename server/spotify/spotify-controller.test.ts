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

    stateMachineSpy.mockRestore();
  });

  it("sets and starts an existing party from storage", async () => {
    const stateMachineSpy = jest.spyOn(StateMachine.prototype, "start");

    const expectedParty: PartyFull = {
      hostUser: new User({ id: "testUser" } as any),
      id: "partyId",
      mainPlaylistId: "mainPlaylistId",
      name: "Party name!",
      queue: new Queue(),
    };

    const partyServiceSpy = jest
      .spyOn(partyService, "getParty")
      .mockImplementation((id) => {
        return Promise.resolve<PartyFull>(id === "partyId" && expectedParty);
      });

    const controller = createController();

    // const hostUser = new User({ id: "testUser" } as any);
    const party = await controller.setParty("partyId");

    // stop current party somehow?

    expect(party).toEqual(expectedParty);

    // check initialization
    expect(SpotifyWebApiMocks.getPlaylist).toBeCalledWith(
      expectedParty.mainPlaylistId,
    );
    expect(SpotifyWebApiMocks.getPlaylist).not.toBeCalledWith(
      expectedParty.backupPlaylistId,
    );
    expect(stateMachineSpy).toBeCalled();

    stateMachineSpy.mockRestore();
    partyServiceSpy.mockRestore();
  });

  it("throws error when setting non-existing party", async () => {
    const controller = createController();

    await expect(controller.setParty("partyId")).rejects.toThrowError(
      "Party not found: partyId",
    );
  });

  it("queueTrack: adds a track to queue", () => {
    // const stateMachineSpy = jest.spyOn(StateMachine.prototype, "start");
    // const controller = createController();
    // check queue is ordered?
    // check socket emitted?
    // check party is saved
  });

  it("queueTrack: rejects with correct error messages", () => {});
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
