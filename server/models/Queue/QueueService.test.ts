import User from "../User/User";
import { Queue } from "./Queue";
import { QueueRepository } from "./QueueRepository";
import { queueService } from "./QueueService";
import { QueueTrack } from "./QueueTrack";

jest.mock("./QueueRepository");

let upsaveSpy;

describe("QueueService", () => {
  beforeEach(() => {
    (QueueRepository as jest.Mock).mockClear();
    jest
      .spyOn(QueueRepository.prototype, "upsave")
      .mockImplementation((obj) => Promise.resolve(obj));
    queueService.setRepository(new QueueRepository());
  });

  it("gets a queue by id", async () => {
    await queueService.getQueue("id");
    expect(
      (QueueRepository as jest.Mock).mock.instances[0].get,
    ).toHaveBeenCalledWith("id");
  });

  it("can create a new empty queue", async () => {
    const newQueue = await queueService.upsave(new Queue({ id: "test" }));

    expect(newQueue).toBeInstanceOf(Queue);
    expect(newQueue.id).toBe("test");
  });

  it("removes a track for a specific user", async () => {
    // jest
    //   .spyOn(QueueRepository.prototype, "removeFromQueue")
    //   .mockImplementationOnce((obj) => Promise.resolve(obj));

    const issuer = new User({ id: "user1" } as any);

    const queue = new Queue<Pick<QueueTrack, "id" | "snoppify">>({
      id: "test",
      queue: [
        {
          id: "item1",
          snoppify: {
            issuer,
            votes: [],
            timestamp: 0,
          },
        },
        {
          id: "item2",
          snoppify: {
            issuer,
            votes: [],
            timestamp: 0,
          },
        },
      ],
    });

    const newQueue: Queue<QueueTrack> = await queueService.removeFromQueue({
      track: { id: "track1" },
      user: issuer,
      queue,
    });

    expect(newQueue.size).toHaveLength(1);
    expect(newQueue.get("track1")).toBeUndefined();
  });
});
