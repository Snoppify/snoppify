import { Queue } from "./Queue";
import { QueueRepository } from "./QueueRepository";
import { queueService } from "./QueueService";

jest.mock("./QueueRepository");

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
});
