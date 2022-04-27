export const SpotifyAPI = jest.fn().mockImplementation();
export const createSpotifyAPI = jest.fn().mockImplementation(() => ({
  config: {},
  setAccessToken: () => {},
  setRefreshToken: () => {},
  init: () => {},
}));
export const createSpotifyAPIUserClient = jest.fn().mockImplementation(() => ({
  config: {},
  setAccessToken: () => {},
  setRefreshToken: () => {},
  init: () => {},
}));
