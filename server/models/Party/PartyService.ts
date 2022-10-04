import { queueService } from "../Queue/QueueService";
import User from "../User/User";
import { PartyFull } from "./Party";
import { PartyRepository } from "./PartyRepository";

let repo: PartyRepository;

export const partyService = {
  getParty,
  setRepository,
};

function setRepository(newRepo: PartyRepository) {
  repo = newRepo;
}

async function getParty(id: string): Promise<PartyFull> {
  const { queueId, ...partyInfo } = await repo.get(id);
  const queue = await queueService.getQueue(queueId);

  return {
    ...partyInfo,
    queue,
    // TODO: FIX!
    hostUser: new User({
      id: "lol",
      displayName: "test",
      name: "lol",
      username: "testfakelol",
    }),
  };
}
