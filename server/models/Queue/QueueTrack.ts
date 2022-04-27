import { UserBase } from "../User/UserBase";

export interface QueueTrack extends SpotifyApi.TrackObjectFull {
  id: string;
  snoppify: {
    issuer: UserBase;
    /** List of userIds */
    votes: string[];
    timestamp: number;
  };
}
