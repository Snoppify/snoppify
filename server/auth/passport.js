const FacebookStrategy = require("passport-facebook").Strategy;
const SpotifyStrategy = require("passport-spotify").Strategy;

const User = require("../models/user");

const appRoot = require("app-root-path");

// load the auth variables
let config = {};
try {
    config = require(appRoot + "/snoppify-config.js");
} catch (ex) {
    console.log("No snoppify config file");
}

module.exports = function(passport) {
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.find(id, function(err, user) {
            done(err, user || false);
        });
    });

    // code for login (use('local-login', new LocalStategy))
    // code for signup (use('local-signup', new LocalStategy))

    if (!config.facebookAuth) {
        console.log("No facebook auth");
        return;
    }

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(
        new FacebookStrategy(
            {
                // pull in our app id and secret from our auth.js file
                clientID: config.facebookAuth.clientID,
                clientSecret: config.facebookAuth.clientSecret,
                callbackURL: config.facebookAuth.callbackURL,
                profileFields: [
                    "id",
                    "name",
                    "displayName",
                    "emails",
                    "photos",
                ],
            },

            // facebook will send back the token and profile
            function(token, refreshToken, profile, done) {
                // asynchronous
                process.nextTick(() => {
                    findOrCreateUser(
                        {
                            id: profile.id,
                            token: token,
                            username: profile.id,
                            displayName: profile.displayName,
                            name: profile.name,
                            profile:
                                profile.photos.length > 0
                                    ? profile.photos[0].value
                                    : null,
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
                clientID: config.spotifyAuth.clientID,
                clientSecret: config.spotifyAuth.clientSecret,
                callbackURL: config.spotifyAuth.callbackURL,
            },

            function(accessToken, refreshToken, expires_in, profile, done) {
                findOrCreateUser(
                    {
                        id: profile.id,
                        token: accessToken,
                        username: profile.id,
                        displayName: profile.displayName || profile.id,
                        name: profile.name,
                        profile:
                            profile.photos.length > 0
                                ? profile.photos[0].value
                                : null,
                    },
                    done,
                );
            },
        ),
    );
};

// private functions

function findOrCreateUser(data, done) {
    // find the user in the database based on their facebook id
    User.find(data.id, function(err, user) {
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            return done(err);
        }

        // if the user is found, then log them in
        if (user) {
            return done(null, user); // user found, return that user
        } else {
            // if there is no user found with that facebook id, create them
            var newUser = new User(data);

            // save our user to the database
            newUser.save(function(err) {
                if (err) {
                    throw err;
                }

                // if successful, return the new user
                return done(null, newUser);
            });
        }
    });
}
