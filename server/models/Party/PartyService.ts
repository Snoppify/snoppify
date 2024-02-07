import { queueService } from "../Queue/QueueService";
import User from "../User/User";
import { PartyFull } from "./Party";
import { PartyRepository } from "./PartyRepository";

let repo: PartyRepository;

export const partyService = {
  getParty,
  setRepository,
  upsave,
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

async function upsave(party: PartyFull): Promise<void> {
  return Promise.all([
    repo.upsave({
      hostUserId: party.hostUser.id,
      id: party.id,
      mainPlaylistId: party.mainPlaylistId,
      name: party.name,
      active: party.active,
      backupPlaylistId: party.backupPlaylistId,
      queueId: party.queue.id,
      currentTrack: party.currentTrack,
      wifi: party.wifi,
    }),
    queueService.upsave(party.queue),
  ]).then();
}
