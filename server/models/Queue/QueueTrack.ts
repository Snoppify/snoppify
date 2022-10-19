import User from "../User/User";

export interface QueueTrack extends SpotifyApi.TrackObjectFull {
  id: string;
  snoppify: {
    issuer: User;
    /** List of userIds */
    votes: string[];
    timestamp: number;
  };
}
