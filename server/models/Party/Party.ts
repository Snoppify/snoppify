import { Queue } from "../Queue/Queue";

export interface PartyNormalized {
  id: string;
  queueId: string;
  currentTrack: SpotifyApi.CurrentlyPlayingObject["item"];
  mainPlaylistId: string;
  backupPlaylistId: string;
}

export interface PartyFull {
  id: string;
  queue: Queue;
  currentTrack: SpotifyApi.CurrentlyPlayingObject["item"];
  mainPlaylistId: string;
  backupPlaylistId: string;
}
