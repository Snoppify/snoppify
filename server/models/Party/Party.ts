export interface Party {
  id: string;
  queueId: string;
  currenTrack: SpotifyApi.CurrentlyPlayingObject["item"];
  mainPlaylistId: string;
  backupPlaylistId: string;
}
