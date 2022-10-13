/** Integration tests */

import { getBackendSpotifyAPIClient } from "./spotify-api";

jest.unmock("spotify-web-api-node");

describe("SpotifyAPI", () => {
  it("should create working backend client", async () => {
    const api = await getBackendSpotifyAPIClient();

    const result = await api.searchTracks("vengaboys");

    expect(result.statusCode).toBe(200);
    expect(result.body.tracks.items).toBeInstanceOf(Array);

    api.close();
  });
});
