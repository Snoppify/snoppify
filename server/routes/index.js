const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const ip = require("ip");

const refreshTokenTpl = require("./refresh-token-template");

const socket = require("../socket");
const spotifyPlaybackApi = require("../spotify/spotify-playback-api");

const isAuthenticated = function(req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated()) return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect("/new-user");
};

const redirectIfAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) return res.redirect("/");
    next();
};

const getPassportState = req => {
    return ip.address() + ":" + req.connection.localPort;
};

module.exports = function(passport, spotify) {
    spotifyPlaybackApi.init(spotify.api);

    let tmp_host_data = {};

    // Spotify refresh token end point
    // OLD ROUTE
    router.get("/refresh-token", (req, res) => {
        let refreshToken = "";
        let p = new Promise(function(resolve, reject) {
            if (req.query.code && req.query.state == "auth") {
                spotify.playbackAPI
                    .getRefreshToken(req.query.code)
                    .then(function(token) {
                        refreshToken = token;
                        resolve();
                    })
                    .catch(function(r) {
                        let e = [
                            r.response.status,
                            "(" + r.response.data.error + ")",
                            r.response.data.error_description,
                        ].join(" ");
                        console.log(e);
                        refreshToken = e;
                        resolve();
                    });
            } else {
                resolve();
            }
        }).then(function() {
            let data = refreshTokenTpl;
            let authUrl = spotify.playbackAPI.getAuthUrl();
            data = data.replace(/{authUrl}/g, authUrl);
            data = data.replace(/{refreshToken}/g, refreshToken);
            res.send(data);
        });
    });

    // Spotify refresh token end point
    // NEW ROUTE
    router.get("/create-spotify-host", (req, res) => {
        if (req.query.check) {
            // finalize the host process
            if (tmp_host_data[req.user.username]) {
                let data = tmp_host_data[req.user.username];
                delete tmp_host_data[req.user.username];

                // create host object
                var id = Date.now(); // just some fake id for now
                if (req.user.host) {
                    req.user.host.id = id;
                } else {
                    req.user.host = {
                        id: id,
                    };
                };

                // Set the access token on the API object to use it in later calls
                spotify.api.setAccessToken(data.access_token);
                spotify.api.setRefreshToken(data.refresh_token);

                res.status(200).end();
            }
            res.status(400).end();

        } else if (req.query.code) {
            // callback from the spotify api
            spotify.api.authorizationCodeGrant(req.query.code).then(function(data) {
                // save token data
                tmp_host_data[req.query.state] = {
                    access_token: data.body['access_token'],
                    refresh_token: data.body['refresh_token'],
                };

                res.redirect("http://" + getPassportState(req) + '/host?success=true');
            }).catch(function() {
                res.redirect("http://" + getPassportState(req) + '/host?success=false');
            });

        } else {
            // return an auth url
            res.send({
                url: spotify.playbackAPI.getAuthUrl(req.user.username),
            });

        }
    });

    function successHandler(res) {
        return r => res.status(200).send(r);
    }

    function errorHandler(res) {
        return r => {
            if (!r || !r.response) {
                console.log(r);
                let status = r && r.status ? r.status : 500;
                return res.status(status).send(r);
            }
            return res.status(r.response.status).send({
                error: r.response.statusText,
            });
        };
    }

    function extractId(string) {
        let id;

        [/spotify:track:(.+)/, /.?open.spotify.com\/track\/(.+)\?.*/].find(
            pattern => string.match(pattern) && (id = string.match(pattern)[1]),
        );

        return id;
    }

    function extractPlaylistId(string) {
        let user, id;

        [
            /spotify:user:(.+):playlist:(.+)/,
            /.?open.spotify.com\/user\/(.+)\/playlist\/(.+)/,
        ].find(
            pattern =>
                string.match(pattern) &&
                (user = string.match(pattern)[1]) &&
                (id = string.match(pattern)[2]),
        );

        if (user && id) {
            return {
                user,
                id,
            };
        }
        return null;
    }

    router.post("/queue-track", (req, res) => {
        console.log(
            `soMeBodyY (user "${req.user.username}" waTNTS to UQUE a song!!!`,
            req.body.trackId,
        );

        spotify.controller
            .queueTrack(req.user.username, req.body.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/dequeue-track", (req, res) => {
        spotify.controller
            .dequeueTrack(req.user.username, req.body.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/vote", (req, res) => {
        spotify.controller
            .vote(req.user.username, req.body.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/unvote", (req, res) => {
        spotify.controller
            .unvote(req.user.username, req.body.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/search", (req, res) => {
        let query = req.query.query || "";

        if (query == "") {
            return res.send({
                tracks: {
                    items: [],
                },
            });
        }

        const extractedId = extractId(query);

        if (extractedId) {
            spotify.api
                .getTracks([extractedId])
                .then(data => {
                    let track = data.body.tracks[0],
                        queueTrack = spotify.controller.queue.get(track);

                    if (track && queueTrack) {
                        track = queueTrack;
                    }

                    res.send({
                        tracks: {
                            items: track ? [track] : [],
                        },
                    });
                })
                .catch(errorHandler(res));
        } else {
            spotify.api
                .searchTracks(query)
                .then(data => {
                    data.body.tracks.items = data.body.tracks.items.map(
                        track => spotify.controller.queue.get(track) || track,
                    );

                    res.send(data.body);
                })
                .catch(errorHandler(res));
        }
    });

    router.post("/set-backup-playlist", (req, res) => {
        if (!req.user.admin) {
            res.status(401).end();
        }

        const playlist = extractPlaylistId(req.body.uri);

        if (!playlist) {
            res.status(400).end();
        }

        spotify.controller
            .setBackupPlaylist(playlist.user, playlist.id)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-track", (req, res) => {
        spotify.controller
            .getTrack(req.query.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/play", (req, res) => {
        spotify.controller
            .play(req.body.playlist)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/pause", (req, res) => {
        spotify.controller
            .pause()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/play-next", (req, res) => {
        spotify.controller
            .playNext()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/empty-playlist", (req, res) => {
        spotify.controller
            .emptyPlaylist()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/empty-queue", (req, res) => {
        spotify.controller
            .emptyQueue()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-queue", (req, res) => {
        res.json({
            data: spotify.controller.getQueue(),
        });
    });

    router.get("/info", (req, res) => {
        res.json({
            queue: spotify.controller.getQueue(),
            currentTrack: spotify.controller.getCurrentTrack(),
            backupPlaylist: spotify.controller.getBackupPlaylist(),
        });
    });

    router.post("/play-sound", (req, res) => {
        if (!socket.io) {
            console.log("No socket");
            return;
        }
        socket.io.local.emit("event", {
            type: "playSound",
            data: {
                sound: req.body.sound,
            },
        });
        res.status(200).end();
    });

    router.get("/auth", (req, res) => {
        // if user is authenticated in the session, carry on

        if (req.isAuthenticated() && req.user) {
            res.json(req.user);
            res.end();
        } else {
            res.sendStatus(403);
        }
    });

    /* GET login page. */
    // router.get(['/', '/index.html'], isAuthenticated, function(req, res) {
    //     res.sendFile(path.resolve('public/index.html'));
    // });

    /* Handle Logout */
    router.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
        // req.session.destroy(function(err) {
        //     res.redirect('/'); //Inside a callback… bulletproof!
        // });
    });

    //////// auth /////////

    // route for facebook authentication and login
    // different scopes while logging in
    router.get("/auth/facebook", (req, ...args) =>
        passport.authenticate("facebook", {
            scope: ["public_profile", "email"],
            state: getPassportState(req),
        })(req, ...args),
    );

    // handle the callback after facebook has authenticated the user
    router.get(
        "/auth/facebook/callback",
        function(req, res, next) {
            console.log(
                "well here we got facebook auth callback:",
                req.method,
                req.params,
                req.query,
            );
            next();
        },
        passport.authenticate("facebook", {
            successRedirect: "/",
            failureRedirect: "/new-user",
        }),
    );

    // route for spotify authentication and login
    // different scopes while logging in
    router.get("/auth/spotify", (req, ...args) =>
        passport.authenticate("spotify", {
            scope: ["user-read-email", "user-read-private"],
            state: getPassportState(req),
        })(req, ...args),
    );

    router.get("/auth/spotify-host", (req, ...args) =>
        passport.authenticate("spotify", {
            scope: spotifyPlaybackApi.scopes,
            state: getPassportState(req) + "/host",
            successRedirect: '/host',
            failureRedirect: '/host',
        })(req, ...args),
    );

    // handle the callback after spotify has authenticated the user
    router.get(
        "/auth/spotify/callback",
        passport.authenticate("spotify", {
            failureRedirect: "/new-user",
        }),
        function(req, res, next) {
            req.session.host = null;
            res.redirect('/');
            next();
        }
    );

    // handle the callback after spotify has authenticated the user
    router.get(
        "/host/auth/spotify/callback",
        passport.authenticate("spotify", {
            scope: spotifyPlaybackApi.scopes,
            failureRedirect: "/host",
        }),
        function(req, res, next) {
            req.user.host = {
                auth: true,
            };
            res.redirect('/host');
            next();
        }
    );

    return router;
};