import { Buffer } from "buffer";
import express from "express";
import { PassportStatic } from "passport";
import User from "../../models/user";

const { spotifyAPIScopes } = require("../../spotify/spotify-playback-api");
const {
  getSnoppifyHost,
  authenticateSpotifyHost,
  createSpotifyHost,
} = require("../../spotify");

const router = express.Router();

const AUTH_STATE_GUEST = "guest";
const AUTH_STATE_HOST_CREATE = "host";
const AUTH_STATE_HOST_LOGIN = "host-login";

// const getPassportState = (req: ExpressRequest, addressSuffix = "") => ({
//   address: process.env.SERVER_URI + addressSuffix,
//   id: req.query.partyId,
// });

const encodeStateObject = (obj = {}) =>
  Buffer.from(JSON.stringify(obj)).toString("base64");

const decodeState = (state = "") => {
  try {
    return JSON.parse(Buffer.from(String(state), "base64").toString());
  } catch (_) {
    //
  }
  return null;
};

const authCallback = (req, res) => {
  req.session.host = null;

  const state = decodeState(String(req.query.state));

  if (!state) {
    res.redirect("/");
    return;
  }

  switch (state.auth) {
    case AUTH_STATE_GUEST:
      req.session.host = null;
      if (state.id) {
        req.user.partyId = state.id;
      }
      res.redirect("/party");
      break;
    case AUTH_STATE_HOST_CREATE:
      createSpotifyHost(req.user)
        .then(() => {
          // TODO: Is this needed?
          req.session.spotify = {
            access_token: req.user._tokens.access_token,
            refresh_token: req.user._tokens.refresh_token,
          };

          res.redirect("/host");
        })
        .catch((error) => {
          console.log(error);
          res.redirect("/host?success=false");
        });
      break;
    case AUTH_STATE_HOST_LOGIN:
      authenticateSpotifyHost(req.user)
        .then(() => {
          // TODO: Is this needed?
          req.session.spotify = {
            access_token: req.user._tokens.access_token,
            refresh_token: req.user._tokens.refresh_token,
          };

          res.redirect("/host");
        })
        .catch((error) => {
          console.log(error);
          res.redirect("/host?success=false");
        });
      break;
    default:
      throw new Error(`Unsupported auth state: ${state.auth}`);
  }
};

export default function routesAuthIndex(passport: PassportStatic) {
  router.get("/auth", (req, res) => {
    // if user is authenticated in the session, carry on

    if (req.isAuthenticated() && req.user) {
      const spotify = getSnoppifyHost(req.user.partyId);

      if (!spotify) {
        res.sendStatus(401);
        return;
      } else if (
        !spotify.initialized &&
        req.user.host &&
        req.user.host.status == "success"
      ) {
        if (!req.session.spotify) {
          // TODO: what is this?
          console.log("could not initialize");
        } else {
          // Set the access token on the API object to use it in later calls
          spotify.api.setAccessToken(req.session.spotify.access_token);
          spotify.api.setRefreshToken(req.session.spotify.refresh_token);

          // spotify.init(req);

          if (req.user.host.id) {
            console.log("set party");
            spotify.controller.setParty(req.user.host);
          }
        }
      }

      res.json(User.sanitize(req.user));
      res.end();
    } else {
      res.sendStatus(403);
    }
  });

  /* Handle Logout */
  router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
    // req.session.destroy(function(err) {
    //     res.redirect('/'); //Inside a callback… bulletproof!
    // });
  });

  // route for facebook authentication and login
  // different scopes while logging in
  router.get("/auth/facebook", (req, ...args) =>
    passport.authenticate("facebook", {
      scope: ["public_profile", "email"],
      state: encodeStateObject({
        id: req.query.partyId, // TODO: check if this is used
        auth: AUTH_STATE_GUEST,
      }),
    })(req, ...args),
  );

  // handle the callback after facebook has authenticated the user
  router.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
      failureRedirect: `${process.env.SERVER_URI}/host?success=false`,
    }),
    authCallback,
  );

  // route for google authentication and login
  // different scopes while logging in
  router.get("/auth/google", (req, ...args) =>
    passport.authenticate("google", {
      scope: ["email", "profile", "https://www.googleapis.com/auth/plus.login"],
      state: encodeStateObject({
        id: req.query.partyId, // TODO: check if this is used
        auth: AUTH_STATE_GUEST,
      }),
    })(req, ...args),
  );

  // handle the callback after google has authenticated the user
  router.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${process.env.SERVER_URI}/host?success=false`,
    }),
    authCallback,
  );

  // route for spotify authentication and login
  // different scopes while logging in
  router.get("/auth/spotify", (req, ...args) =>
    passport.authenticate("spotify", {
      scope: ["user-read-email", "user-read-private"],
      state: encodeStateObject({
        id: req.query.partyId, // TODO: check if this is used
        auth: AUTH_STATE_GUEST,
      }),
    })(req, ...args),
  );

  // authenticate host and create party
  router.get("/auth/spotify-host", (req, ...args) =>
    passport.authenticate("spotify", {
      scope: spotifyAPIScopes,
      state: encodeStateObject({
        id: req.query.partyId, // TODO: check if this is used
        auth: AUTH_STATE_HOST_CREATE,
      }),
    })(req, ...args),
  );

  // authenticate host
  router.get("/auth/spotify-host-login", (req, ...args) =>
    passport.authenticate("spotify", {
      scope: spotifyAPIScopes,
      state: encodeStateObject({
        id: req.query.partyId, // TODO: check if this is used
        auth: AUTH_STATE_HOST_LOGIN,
      }),
    })(req, ...args),
  );

  // handle the callback after spotify has authenticated the user
  router.get(
    "/auth/spotify/callback",
    passport.authenticate("spotify", {
      failureRedirect: `${process.env.SERVER_URI}/host?success=false`,
    }),
    authCallback,
  );

  return router;
}
