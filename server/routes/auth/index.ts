import { Buffer } from "buffer";
import express, { Request } from "express";
import { PassportStatic } from "passport";
import crypto from "crypto";
import axios from "axios";
import { userService } from "../../models/User/UserService";
import User from "../../models/User/User";
import { createSpotifyHost, createSpotifyHostWithParty } from "../../spotify";
import { spotifyAPIScopes } from "../../spotify/spotify-playback-api";
import { logger } from "../../utils/snoppify-logger";

const router = express.Router();

const AUTH_STATE_GUEST = "guest";
const AUTH_STATE_HOST_CREATE_PARTY = "host";
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

const authCallback = (req: Request, res) => {
  req.session.host = null;

  const state = decodeState(String(req.query.state));

  if (!state) {
    res.redirect("/");
    return;
  }

  logger.info("authCallback", state);

  switch (state.auth) {
    case AUTH_STATE_GUEST:
      req.session.host = null;
      if (state.id) {
        req.user.partyId = state.id;
      }
      res.redirect("/party");
      break;
    case AUTH_STATE_HOST_CREATE_PARTY:
      createSpotifyHostWithParty(req.user)
        // TODO: Replace with api endpoint
        .then(() => {
          // TODO: Is this needed?
          req.session.spotify = {
            access_token: req.user._tokens.access_token,
            refresh_token: req.user._tokens.refresh_token,
          };

          res.redirect("/host");
        })
        .catch((error) => {
          logger.error(error);
          res.redirect("/host?success=false");
        });
      break;
    case AUTH_STATE_HOST_LOGIN:
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
          logger.error(error);
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
      // const spotify = getSnoppifyHost(req.user.partyId);
      const spotify = req.snoppifyHost;

      if (!spotify) {
        res.sendStatus(401);
        return;
      } else if (
        !spotify.initialized &&
        req.user.host &&
        req.user.host.status === "success"
      ) {
        if (!req.session.spotify) {
          // TODO: what is this?
          logger.error("could not initialize");
        } else {
          // Set the access token on the API object to use it in later calls
          spotify.api.setAccessToken(req.session.spotify.access_token);
          spotify.api.setRefreshToken(req.session.spotify.refresh_token);

          // spotify.init(req);

          if (req.user.host.id) {
            logger.info("set party", req.user.host);
            spotify.controller.setParty(req.user.host.id);
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

  // route to authenticate via username and password
  router.post(
    "/login/password",
    passport.authenticate("local", {
      failureRedirect: "/login",
    }),
    async (req, res) => {
      req.session.host = null;
      if (req.body.partyId) {
        req.user.partyId = req.body.partyId;
        await userService.upsave(req.user);
      }
      res.redirect("/party");
    },
  );

  // route to sign up a new guest user
  // must be enabled in the environment variables
  router.post("/auth/signup", (req, res, next) => {
    if (process.env.ENABLE_SIGNUP !== "true") {
      res.redirect("/signup");
      return;
    }
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async (err, hashedPassword) => {
        if (err) {
          return next(err);
        }
        const newUser = new User({
          id: `u-${Date.now().toString()}`,
          username: req.body.username,
          displayName: req.body.username,
          name: req.body.username,
          _salt: Uint8ArrayToBase64String(salt),
          _hashedPassword: Uint8ArrayToBase64String(hashedPassword),
        });

        // save our user to the database
        const user = await userService.upsave(newUser);
        req.login(user, (saveErr) => {
          if (saveErr) {
            return next(saveErr);
          }
          res.redirect("/");
          return undefined;
        });

        return undefined;
      },
    );
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
        auth: AUTH_STATE_HOST_CREATE_PARTY,
      }),
    })(req, ...args),
  );

  // authenticate host
  router.get(
    "/auth/spotify-host-login",
    turnstileCheckerMiddleware,
    (req, ...args) =>
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

// source: https://github.com/Lukas220300/js-crypto-converter
function Uint8ArrayToBase64String(byteArray: Uint8Array) {
  return btoa(String.fromCharCode(...byteArray));
}

async function turnstileCheckerMiddleware(req, res, next) {
  const stop = () => {
    res.sendStatus(403);
  };

  const token = req.query["cf-turnstile-response"];

  if (typeof token !== "string") {
    stop();
    return;
  }

  // validate the turnstile response with cloudflare
  const body = {
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: token,
  };

  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const result = await axios.post(url, body);

  if (!result.data.success) {
    stop();
    return;
  }

  next();
}
