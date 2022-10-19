export const SpotifyWebApiMocks = {
  clientCredentialsGrant: jest.fn(() => {
    return Promise.resolve({
      body: {
        access_token: "access_token",
        expires_in: 99999999,
        token_type: "token_type",
      },
      headers: null,
      statusCode: 200,
    });
  }),

  createPlaylist: jest.fn(() => {
    return Promise.resolve({ body: { id: "new_playlist_id" } });
  }),

  getAccessToken: jest.fn(() => undefined),

  getCredentials: jest.fn(() => ({})),

  getPlaylist: jest.fn(() => Promise.resolve({ body: { tracks: [] } })),

  getTracks: jest.fn(() =>
    Promise.resolve<{ body: { tracks: { id: string }[] } }>({
      body: { tracks: [{ id: "track1" }, { id: "track2" }] },
    }),
  ),
};

export default jest.fn(() => {
  return {
    ...(jest.createMockFromModule("spotify-web-api-node") as any),
    ...SpotifyWebApiMocks,
  };
});
