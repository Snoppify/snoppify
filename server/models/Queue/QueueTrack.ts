import User from "../User/User";

export interface QueueTrack extends QueueSpotifyTrack {
  id: string;
  snoppify: {
    issuer: Pick<User, "id" | "username" | "displayName" | "name" | "profile">;
    /** List of userIds */
    votes: string[];
    timestamp: number;
  };
}

export type QueueSpotifyTrack = Pick<
  SpotifyApi.TrackObjectFull,
  "id" | "uri" | "name" | "artists" | "duration_ms"
> & {
  album: Pick<
    SpotifyApi.TrackObjectFull["album"],
    "artists" | "id" | "images" | "name" | "release_date" | "type" | "uri"
  >;
};
