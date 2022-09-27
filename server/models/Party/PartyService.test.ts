import { Queue } from "../Queue/Queue";
import { queueService } from "../Queue/QueueService";
import { PartyRepository } from "./PartyRepository";
import { partyService } from "./PartyService";

jest.mock("./PartyRepository");

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
      }),
    );
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
});
