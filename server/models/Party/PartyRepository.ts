import { JSONRepository } from "../JSONRepository";
import { PartyNormalized } from "./Party";

export class PartyRepository extends JSONRepository<PartyNormalized> {
  constructor() {
    super({ name: "party" });
  }
}
