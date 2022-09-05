import { Repository } from "../Repository";
import { QueueRepository } from "./QueueRepository";

describe("QueueRepository", () => {
  it("works", () => {
    const queueRepo = new QueueRepository();
    expect(queueRepo).toBeInstanceOf(QueueRepository);
    expect(queueRepo).toBeInstanceOf(Repository);
  });
});
