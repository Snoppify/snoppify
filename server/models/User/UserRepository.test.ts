import { Repository } from "../Repository";
import { UserRepository } from "./UserRepository";

describe("UserRepository", () => {
  it("works", () => {
    const userRepo = new UserRepository();
    expect(userRepo).toBeInstanceOf(UserRepository);
    expect(userRepo).toBeInstanceOf(Repository);
  });
});
