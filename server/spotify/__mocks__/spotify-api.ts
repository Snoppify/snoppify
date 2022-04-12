export const SpotifyAPI = jest.fn().mockImplementation();
export const createSpotifyAPI = jest.fn().mockImplementation(() => ({
  config: {},
  setAccessToken: () => {},
  setRefreshToken: () => {},
  init: () => {},
}));
