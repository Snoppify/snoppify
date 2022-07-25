import { UserRepository } from "./UserRepository";

console.log("create repo");
const repo = new UserRepository();

export const userService = { getUser };

function getUser(id: string) {
  return repo.get(id);
}
