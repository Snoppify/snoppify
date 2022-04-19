/** Integration tests */

import { backendSpotifyAPIClient } from "./spotify-api";

describe("SpotifyAPI", () => {
  it("should create working backend client", async () => {
    const api = await backendSpotifyAPIClient;

    const result = await api.searchTracks("vengaboys");

    expect(result.statusCode).toBe(200);
    expect(result.body.tracks.items).toBeInstanceOf(Array);

    api.close();
  });
});
