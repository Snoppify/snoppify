import User from "../User/User";

export interface QueueTrack extends SpotifyApi.TrackObjectFull {
  id: string;
  snoppify: {
    issuer: Pick<User, "id" | "username" | "displayName" | "name" | "profile">;
    /** List of userIds */
    votes: string[];
    timestamp: number;
  };
}
