import { Repository } from "../Repository";
import { PartyRepository } from "./PartyRepository";

describe("PartyRepository", () => {
  it("works", () => {
    const userRepo = new PartyRepository();
    expect(userRepo).toBeInstanceOf(PartyRepository);
    expect(userRepo).toBeInstanceOf(Repository);
  });
});
