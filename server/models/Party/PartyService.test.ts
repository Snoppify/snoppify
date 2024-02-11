import { Queue } from "../Queue/Queue";
import { queueService } from "../Queue/QueueService";
import User from "../User/User";
import { PartyFull, PartyNormalized } from "./Party";
import { PartyRepository } from "./PartyRepository";
import { partyService } from "./PartyService";

jest.mock("./PartyRepository");
jest.mock("../Queue/QueueService");

const mockedQueueService = jest.mocked(queueService);

describe("PartyService", () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (PartyRepository as jest.Mock).mockClear();
    jest.spyOn(PartyRepository.prototype, "get").mockImplementation((id) =>
      Promise.resolve({
        id,
        backupPlaylistId: "bpID",
        mainPlaylistId: "mpID",
        queueId: "qID",
        currentTrack: {} as any,
        name: "name",
        active: true,
        hostUserId: "userID",
        snoppiCodeUUID: "00000000",
      }),
    );
    jest
      .spyOn(PartyRepository.prototype, "upsave")
      .mockImplementation(() => Promise.resolve() as any);
    jest
      .spyOn(queueService, "getQueue")
      .mockImplementation((id) => Promise.resolve(new Queue({ id })));
    partyService.setRepository(new PartyRepository());
  });

  it("gets a party by id", async () => {
    const party = await partyService.getParty("test");

    expect(
      (PartyRepository as jest.Mock).mock.instances[0].get,
    ).toHaveBeenCalledWith("test");

    expect(party.queue).toBeInstanceOf(Queue);
    expect(party.queue.id).toBe("qID" /* id from mock in beforeEach */);
  });

  it("saves a party", async () => {
    const party: PartyFull = {
      hostUser: new User({
        id: "lol",
        displayName: "test",
        name: "lol",
        username: "testfakelol",
      }),
      id: "partyId",
      mainPlaylistId: "mainPlaylistId",
      name: "name",
      active: true,
      queue: new Queue({ id: "queueId" }),
      backupPlaylistId: "backupPlaylistId",
      currentTrack: {} as any,
      wifi: { encryption: "lol", password: "lol", ssid: "lol" },
      snoppiCodeUUID: "00000000",
    };

    await partyService.upsave(party);

    expect(
      (PartyRepository as jest.Mock).mock.instances[0].upsave,
    ).toHaveBeenCalledWith<[PartyNormalized]>({
      id: "partyId",
      mainPlaylistId: "mainPlaylistId",
      name: "name",
      active: true,
      currentTrack: party.currentTrack,
      wifi: party.wifi,
      queueId: party.queue.id,
      hostUserId: party.hostUser.id,
      backupPlaylistId: party.backupPlaylistId,
      snoppiCodeUUID: party.snoppiCodeUUID,
    });

    expect(mockedQueueService.upsave).toHaveBeenCalledWith(party.queue);
  });
});
