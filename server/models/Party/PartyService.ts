import { generateCustomUuid } from "custom-uuid";
import { queueService } from "../Queue/QueueService";
import User from "../User/User";
import { PartyFull } from "./Party";
import { PartyRepository } from "./PartyRepository";
import { logger } from "../../utils/snoppify-logger";
import { getUUIDFromSnoppiCode, isValidUUID } from "../code-words";

let repo: PartyRepository;

export const partyService = {
  getParty,
  getPartyFromSnoppiCode,
  setRepository,
  upsave,
  getUniqueSnoppiCodeUUID,
};

function setRepository(newRepo: PartyRepository) {
  repo = newRepo;
}

async function getParty(id: string): Promise<PartyFull> {
  const party = await repo.get(id);
  if (!party) {
    return null;
  }
  const { queueId, ...partyInfo } = party;
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

async function getPartyFromSnoppiCode(code: string): Promise<PartyFull> {
  const snoppiCodeUUID = isValidUUID(code) ? code : getUUIDFromSnoppiCode(code);
  const party = await repo.getBy("snoppiCodeUUID", snoppiCodeUUID);
  if (!party) {
    return null;
  }
  const { queueId, ...partyInfo } = party;
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
      snoppiCodeUUID: party.snoppiCodeUUID,
    }),
    queueService.upsave(party.queue),
  ]).then();
}

async function getUniqueSnoppiCodeUUID(): Promise<string> {
  let failSafe = 1000;
  while (failSafe > 0) {
    const snoppiCodeUUID = generateCustomUuid("123456789abcdef", 8);

    // eslint-disable-next-line no-await-in-loop
    const party = await repo.getBy("snoppiCodeUUID", snoppiCodeUUID);

    if (!party) {
      return snoppiCodeUUID;
    }
    failSafe--;
  }

  logger.error("Failed to generate snoppi code");

  return null;
}
