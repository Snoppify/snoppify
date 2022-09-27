import { JSONRepository } from "../JSONRepository";
import { Party } from "./Party";

export class PartyRepository extends JSONRepository<Party> {
  constructor() {
    super({ name: "party" });
  }
}
