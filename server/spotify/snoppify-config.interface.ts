export interface ISnoppifyConfig {
  /**
   * Spotify client id
   */
  client_id: string;
  /**
   * Spotiy client secret
   */
  client_secret: string;

  auth_token: string;

  /**
   * Spotify refresh token
   */
  refresh_token: string;
  /**
   * spotify user
   */
  owner: string;
  /**
   * backup queue playlist id
   */
  playlist: string;

  /**
   * spotify auth
   */
  spotifyAuth: IAuthInfo;
  /**
   * facebook auth
   */
  facebookAuth: IAuthInfo;
  /**
   * google auth
   */
  googleAuth: IAuthInfo;
}

export interface IAuthInfo {
  clientID: string;
  clientSecret: string;
}
