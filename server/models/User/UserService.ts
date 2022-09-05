import { Queue } from "../Queue/Queue";
import { UserBase } from "./UserBase";
import { UserRepository } from "./UserRepository";

let repo: UserRepository;

export const userService = {
  getUser,
  upsave,
  setRepository,
  getAll,
  addToQueue,
  removeFromQueue,
};

function getUser(id: string) {
  return repo.get(id);
}

function upsave(user: UserBase) {
  return repo.upsave(user);
}

function setRepository(newRepo: UserRepository) {
  repo = newRepo;
}

function getAll() {
  return repo.getAll();
}

// TODO: Write tests THEn implement! then replace direct modification of User.queue!
function addToQueue(user: UserBase, track: { id: string }): Promise<UserBase> {
  (user.queue as Queue<{ id: string }>).add(track);
  return userService.upsave(user);
}
function removeFromQueue(user: UserBase, track: { id: string }) {
  (user.queue as Queue<{ id: string }>).remove(track);
  return upsave(user);
}
// function clearQueue() {}
// function clearUser() {}
// function toggleVoteOnTrack(opts: { voter; votee; track: { id: string } }) {}
