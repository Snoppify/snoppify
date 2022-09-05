import { JSONRepository } from "../JSONRepository";
import { Queue } from "./Queue";

export class QueueRepository extends JSONRepository<Queue> {
  constructor() {
    super({ name: "queues", modelClass: Queue });
  }
}
