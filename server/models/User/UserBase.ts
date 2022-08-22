import { Votes } from "./Votes";

/**
 * This mainly exists to avoid circular dependencies.. refactor away
 */
export class UserBase {
  queue: any;

  votes: Votes;

  friends: { userName: string; name: string }[];

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
