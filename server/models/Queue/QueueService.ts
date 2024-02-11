import { Queue } from "./Queue";
import { QueueRepository } from "./QueueRepository";
import { QueueTrack } from "./QueueTrack";

let repo: QueueRepository;

export const queueService = {
  setRepository,
  getQueue,
  deleteQueue,
  upsave,
};

function setRepository(newRepo: QueueRepository) {
  repo = newRepo;
}

function getQueue(id: string) {
  return repo.get(id);
}

function deleteQueue(id: string) {
  return repo.delete(id);
}

function upsave(queue: Queue<QueueTrack>) {
  return repo.upsave(queue);
}
