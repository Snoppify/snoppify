import { Votes } from "./Votes";

/**
 * This mainly exists to avoid circular dependencies.. refactor away
 */
export class UserBase {
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
  profile: { value: string };

  /** Tokens for Spotify api? */
  _tokens?: {
    access_token: string;
    refresh_token: string;
  };

  /** Party information if the user is a host for a party */
  host?: {
    status?: "success" | string;

    /** party id */
    id?: string;

    /** party name */
    name?: string;

    playlist?: string;
  };

  parties?: { id: string; name: string }[];

  partyId?: string;
}
