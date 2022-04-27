import { Votes } from "./Votes";

/**
 * This mainly exists to avoid circular dependencies.. refactor away
 */
export abstract class UserBase {
  queue: any;

  votes: Votes;

  friends: any;

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
