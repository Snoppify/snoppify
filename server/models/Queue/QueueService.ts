import { Queue } from "./Queue";
import { QueueRepository } from "./QueueRepository";

let repo: QueueRepository;

export const queueService = {
  setRepository,
  getQueue,
  createQueue,
};

function setRepository(newRepo: QueueRepository) {
  repo = newRepo;
}

function getQueue(id: string) {
  return repo.get(id);
}

function createQueue(opts: { id: string }) {
  return repo.upsave(new Queue(opts));
}
