// const FacebookStrategy = require("passport-facebook").Strategy;
// const SpotifyStrategy = require("passport-spotify").Strategy;
// const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
import { Strategy as FacebookStrategy } from "passport-facebook";
import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import User from "../models/user";

export function passportInit(passport) {
  // used to serialize the user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    User.find(id, (err, user) => {
      done(err, user || false);
    });
  });

  // code for login (use('local-login', new LocalStategy))
  // code for signup (use('local-signup', new LocalStategy))

  // =========================================================================
  // FACEBOOK ================================================================
  // =========================================================================
  passport.use(
    new FacebookStrategy(
      {
        // pull in our app id and secret from our auth.js file
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URI}/auth/facebook/callback`,
        profileFields: ["id", "name", "displayName", "emails", "photos"],
      },

      // facebook will send back the token and profile
      (token, refreshToken, profile, done) => {
        // asynchronous
        process.nextTick(() => {
          findOrCreateUser(
            {
              id: profile.id,
              token,
              username: profile.id,
              displayName: profile.displayName,
              name: profile.name,
              profile:
                profile.photos.length > 0 ? profile.photos[0].value : null,
            },
            done,
          );
        });
      },
    ),
  );

  // =========================================================================
  // SPOTIFY =================================================================
  // =========================================================================

  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URI}/auth/spotify/callback`,
      },

      (access_token, refresh_token, expires_in, profile, done) => {
        console.log("create spotify user", profile.id);
        findOrCreateUser(
          {
            id: profile.id,
            username: profile.id,
            displayName: profile.displayName || profile.id,
            name: profile.displayName,
            profile: profile.photos.length > 0 ? profile.photos[0] : null,
            _tokens: {
              access_token,
              refresh_token,
            },
          },
          done,
        );
      },
    ),
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URI}/auth/google/callback`,
      },

      (accessToken, refreshToken, profile, done) => {
        findOrCreateUser(
          {
            id: profile.id,
            token: accessToken,
            username: profile.id,
            displayName: profile.displayName || profile.id,
            name: profile.name.givenName,
            profile: profile.photos.length > 0 ? profile.photos[0].value : null,
          },
          done,
        );
      },
    ),
  );
}

// private functions

function findOrCreateUser(data, done) {
  // find the user in the database based on their facebook id
  User.find(data.id, (err, user) => {
    // if there is an error, stop everything and return that
    // ie an error connecting to the database
    if (err) {
      return done(err);
    }

    // if the user is found, then log them in
    if (user) {
      // user found, update data
      Object.assign(user, data);

      User.save(user, (_err) => {
        if (_err) {
          throw _err;
        }

        return done(null, user);
      });
    } else {
      // if there is no user found with that facebook id, create them
      const newUser = new User(data);

      // save our user to the database
      User.save(newUser, (_err) => {
        if (_err) {
          throw _err;
        }

        // if successful, return the new user
        return done(null, newUser);
      });
    }

    return undefined;
  });
}
