export const SpotifyWebApiMocks = {
  clientCredentialsGrant: () => {
    return Promise.resolve({
      body: {
        access_token: "access_token",
        expires_in: 99999999,
        token_type: "token_type",
      },
      headers: null,
      statusCode: 200,
    });
  },

  createPlaylist: jest.fn(() => {
    return Promise.resolve({ body: { id: "new_playlist_id" } });
  }),

  getAccessToken: () => undefined,
};

export default jest.fn(() => {
  return {
    ...(jest.createMockFromModule("spotify-web-api-node") as any),
    ...SpotifyWebApiMocks,
  };
});
