import { JSONRepository } from "../JSONRepository";
import User from "./User";

export class UserRepository extends JSONRepository<User> {
  constructor() {
    super({ name: "users", modelClass: User });
  }
}
