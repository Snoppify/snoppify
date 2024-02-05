import { pick } from "lodash";
import { JSONRepository } from "../JSONRepository";
import { Queue } from "./Queue";
import { QueueTrack } from "./QueueTrack";

export class QueueRepository extends JSONRepository<Queue<QueueTrack>> {
  constructor() {
    super({ name: "queues", modelClass: Queue });
  }

  upsave(object: Queue<QueueTrack>): Promise<Queue<QueueTrack>> {
    const queue = object.queue.map(
      ({ album, artists, duration_ms, id, name, snoppify, uri }) => ({
        album: pick(album, [
          "artists",
          "id",
          "images",
          "name",
          "release_date",
          "type",
          "uri",
        ]),
        artists,
        duration_ms,
        id,
        name,
        snoppify,
        uri,
      }),
    );

    return super.upsave(new Queue({ ...object, queue }));
  }
}
