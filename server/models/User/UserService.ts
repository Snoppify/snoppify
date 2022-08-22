import { UserBase } from "./UserBase";
import { UserRepository } from "./UserRepository";

let repo: UserRepository;

export const userService = { getUser, upsave, setRepository, getAll };

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
