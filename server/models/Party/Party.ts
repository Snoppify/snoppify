import { Queue } from "../Queue/Queue";
import { QueueTrack } from "../Queue/QueueTrack";

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
  queue: Queue<QueueTrack>;
  currentTrack: SpotifyApi.CurrentlyPlayingObject["item"];
  mainPlaylistId: string;
  backupPlaylistId: string;
  wifi?: { ssid: string; password: string; encryption: string };
}
