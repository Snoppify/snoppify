import { JSONRepository } from "../JSONRepository";
import { Queue } from "./Queue";
import { QueueTrack } from "./QueueTrack";

export class QueueRepository extends JSONRepository<Queue<QueueTrack>> {
  constructor() {
    super({ name: "queues", modelClass: Queue });
  }
}
