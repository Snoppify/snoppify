import { Queue } from "../Queue/Queue";
import User from "./User";
import { UserRepository } from "./UserRepository";

let repo: UserRepository;

export const userService = {
  getUser,
  getUserByUsername,
  upsave,
  setRepository,
  getAll,
  addToQueue,
  removeFromQueue,
};

function getUser(id: string) {
  return repo.get(id);
}

function getUserByUsername(id: string) {
  return repo.getBy("username", id);
}

function upsave(user: User) {
  return repo.upsave(user);
}

function setRepository(newRepo: UserRepository) {
  repo = newRepo;
}

function getAll() {
  return repo.getAll();
}

// TODO: Write tests THEn implement! then replace direct modification of User.queue!
function addToQueue(user: User, track: { id: string }): Promise<User> {
  (user.queue as Queue<{ id: string }>).add(track);
  return userService.upsave(user);
}
function removeFromQueue(user: User, track: { id: string }) {
  (user.queue as Queue<{ id: string }>).remove(track);
  return upsave(user);
}
// function clearQueue() {}
// function clearUser() {}
// function toggleVoteOnTrack(opts: { voter; votee; track: { id: string } }) {}
