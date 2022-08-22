import { Votes } from "./Votes";

/**
 * This mainly exists to avoid circular dependencies.. refactor away
 */
export class UserBase {
  queue: any;

  votes: Votes;

  // TODO: Find out which name fields are actually used
  friends: { username: string; name?: string; displayName?: string }[];

  id: string;

  username: string;

  displayName: string;

  name: string;

  /**
   * Profile picture uri
   * TODO: Rename
   */
  profile: string;
}
