import { Queue } from "../Queue/Queue";

export interface PartyNormalized {
  id: string;
  name: string;
  queueId: string;
  currentTrack: SpotifyApi.CurrentlyPlayingObject["item"];
  mainPlaylistId: string;
  backupPlaylistId: string;
  wifi?: { ssid: string; password: string; encryption: string };
}

export interface PartyFull {
  id: string;
  name: string;
  queue: Queue;
  currentTrack: SpotifyApi.CurrentlyPlayingObject["item"];
  mainPlaylistId: string;
  backupPlaylistId: string;
  wifi?: { ssid: string; password: string; encryption: string };
}
