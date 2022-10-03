import { Queue } from "../Queue/Queue";
import { QueueTrack } from "../Queue/QueueTrack";
import User from "../User/User";

export interface PartyNormalized {
  id: string;
  name: string;
  queueId: string;
  currentTrack?: SpotifyApi.CurrentlyPlayingObject["item"];
  mainPlaylistId: string;
  backupPlaylistId?: string;
  wifi?: { ssid: string; password: string; encryption: string };
  hostUserId: string;
}

export interface PartyFull {
  id: string;
  name: string;
  queue: Queue<QueueTrack>;
  currentTrack?: SpotifyApi.CurrentlyPlayingObject["item"];
  mainPlaylistId: string;
  backupPlaylistId?: string;
  wifi?: { ssid: string; password: string; encryption: string };
  hostUser: User;
}
