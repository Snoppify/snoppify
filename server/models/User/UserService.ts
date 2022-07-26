import User from "./User";
import { UserRepository } from "./UserRepository";

let repo: UserRepository;

export const userService = { getUser, upsave, setRepository };

function getUser(id: string) {
  return repo.get(id);
}

function upsave(user: User) {
  return repo.upsave(user);
}

function setRepository(newRepo: UserRepository) {
  repo = newRepo;
}
