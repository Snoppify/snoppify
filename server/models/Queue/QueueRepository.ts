import { JSONRepository } from "../JSONRepository";
import { Queue } from "./Queue";

export class QueueRepository extends JSONRepository<Queue<any>> {
  constructor() {
    super({ name: "queues", modelClass: Queue });
  }
}
