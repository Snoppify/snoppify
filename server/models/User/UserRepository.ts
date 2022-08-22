import { JSONRepository } from "../JSONRepository";
import { UserBase } from "./UserBase";

export class UserRepository extends JSONRepository<UserBase> {
  constructor() {
    super({ name: "users", modelClass: UserBase });
  }
}
