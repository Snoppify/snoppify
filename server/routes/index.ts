import express, { Request as ExpressRequest } from "express";
import ip, { address } from "ip";
import { createSpotifyAPI } from "../spotify/spotify-api";

import codeWords from "../models/code-words";
import User from "../models/user";
import socket from "../socket";
import { createSnoppifyHost, getSnoppifyHost } from "../spotify";
import { SpotifyPlaybackAPI, spotifyAPIScopes } from "../spotify/spotify-playback-api";
import refreshTokenTpl from "./refresh-token-template";

const spotifyAPI = createSpotifyAPI().init();;

const spotify = createSnoppifyHost({} as any);
const spotifyPlaybackApi = new SpotifyPlaybackAPI(spotify.api);

const router = express.Router();

const isAuthenticated = function (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated()) return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect("/new-user");
};

const redirectIfAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) return res.redirect("/party");
    next();
};

const getPassportState = (req: ExpressRequest, addressSuffix = "") => {
    return {
        address: ip.address() + ":" + req.connection.localPort + addressSuffix,
        id: req.query.partyId
    };
};

/**
 * Throws an error if the provided param is not a string. Used for
 * checking/asserting the type of e.g. parsed querystrings.
 * @param str 
 */
const checkStr = (str: any) => {
    if (typeof str === "string") return str;
    throw new Error("Not a string: " + JSON.stringify(str));
};

export default function (passport) {
    // spotifyPlaybackApi.init(spotify.api);

    let tmp_host_data = {};

    // Spotify refresh token end point
    // NEW ROUTE
    router.get("/create-spotify-host", (req, res) => {
        console.log("/create-spotify-host");

        if (req.query.access_token && req.query.refresh_token) {
            // finalize the host process

            // create host object
            var id = Date.now().toString(); // just some fake id for now
            var hostData = {
                status: 'success',
                id: id,
                ip: ip.address(),
                hostCode: codeWords.getCode(ip.address()),
                name: "Snoppify " + id,
                playlist: null,
            };
            if (!req.user.host) {
                req.user.host = {};
            }
            for (var key in hostData) {
                req.user.host[key] = hostData[key];
            }

            if (!req.user.parties) {
                req.user.parties = [];
            }
            req.user.parties.push({
                id: id,
                name: hostData.name,
            });

            req.user.partyId = id;

            req.session.spotify = {
                access_token: req.query.access_token,
                refresh_token: req.query.refresh_token,
            };

            User.save(req.user, () => {
                console.log("Set info on spotify api");

                const snoppifyHost = createSnoppifyHost({
                    owner: req.user.username,
                    accessToken: checkStr(req.query.access_token),
                    refreshToken: checkStr(req.query.refresh_token),
                    hostId: id,
                });

                snoppifyHost.controller
                    .createMainPlaylist(hostData.name)
                    .then(function (playlist) {
                        console.log("started hosting!");

                        snoppifyHost.controller.setParty(req.user.host, {
                            mainPlaylist: playlist,
                            backupPlaylist: null,
                        }).then(() => {
                            res.status(200).end();
                        }).catch(r => {
                            console.log(r);
                            res.status(400).end();
                        });
                    })
                    .catch(function (r) {
                        console.log(r);
                        res.status(400).end();
                    });
            });

        } else if (req.query.code) {
            // callback from the spotify api
            console.log("callback from the spotify api");
            spotifyAPI.authorizationCodeGrant(checkStr(req.query.code)).then(function (data) {
                var params = [
                    "success=true",
                    "state=host",
                    "access_token=" + data.body['access_token'],
                    "refresh_token=" + data.body['refresh_token'],
                ];

                res.redirect("http://" + getPassportState(req, '/host?' + params.join("&")).address);
            }).catch(function () {
                console.log("callback from the spotify api FAILED");
                res.redirect("http://" + getPassportState(req, '/host?success=false').address);
            });

        } else {
            // return an auth url
            console.log("return an auth url")
            let url = spotifyAPI.createAuthorizeURL(spotifyAPIScopes, getPassportState(req, '/create-spotify-host').address);
            res.redirect(url);
        }
    });

    // Spotify refresh token end point
    // NEW ROUTE
    router.get("/authenticate-spotify-host", (req, res) => {
        if (req.query.access_token && req.query.refresh_token) {
            // finalize the host process

            // // TODO: should fetch old host data maybe
            // var hostData = {
            //     status: 'success',
            //     ip: ip.address(),
            //     hostCode: codeWords.getCode(ip.address()),
            // };
            // if (!req.user.host) {
            //     req.user.host = {};
            // }
            // for (var key in hostData) {
            //     req.user.host[key] = hostData[key];
            // }

            req.session.spotify = {
                access_token: req.query.access_token,
                refresh_token: req.query.refresh_token,
            };

            User.save(req.user, () => {
                // // Set the access token on the API object to use it in later calls
                // spotify.api.config.owner = req.user.username;
                // spotify.api.setAccessToken(checkStr(req.query.access_token));
                // spotify.api.setRefreshToken(checkStr(req.query.refresh_token));

                // // spotify.init(req);

                console.log("authenticated host!");

                if (req.user.host.id) {
                    req.snoppifyHost.controller.setParty(req.user.host)
                        .then(() => {
                            res.status(200).end();
                        }).catch(r => {
                            // Bad party, remove
                            // TODO: better party handling
                            delete req.user.host.id;
                            delete req.user.host.name;

                            User.save(req.user, () => {
                                res.status(200).end();
                            });
                        });
                } else {
                    res.status(200).end();
                }
            });

        } else if (req.query.code) {
            // callback from the spotify api
            spotifyAPI.authorizationCodeGrant(checkStr(req.query.code)).then(function (data) {
                var params = [
                    "success=true",
                    "state=auth",
                    "access_token=" + data.body['access_token'],
                    "refresh_token=" + data.body['refresh_token'],
                ];

                res.redirect("http://" + getPassportState(req, + '/host?' + params.join("&")).address);
            }).catch(function (r) {
                res.redirect("http://" + getPassportState(req, '/host?success=false').address);
            });

        } else {
            var url = spotifyAPI.createAuthorizeURL(spotifyAPIScopes, getPassportState(req, '/authenticate-spotify-host').address);
            res.redirect(url);
        }
    });

    function successHandler(res) {
        return r => res.status(200).send(r);
    }

    function errorHandler(res) {
        return r => {
            if (!r || !r.response) {
                let status = r && r.status ? r.status : 500;
                return res.status(status).send(r);
            }
            return res.status(r.response.status).send({
                error: r.response.statusText,
            });
        };
    }

    function extractId(string) {
        let id: string;

        [/spotify:track:(.+)/, /.?open.spotify.com\/track\/(.+)\?.*/].find(
            pattern => string.match(pattern) && (id = string.match(pattern)[1]),
        );

        return id;
    }

    function extractPlaylistId(string) {
        let id;

        [
            /spotify:playlist:(.+)/,
            /.?open\.spotify\.com\/playlist\/([^\?]+)/,
        ].find(
            pattern =>
                string.match(pattern) &&
                (id = string.match(pattern)[1]),
        );

        if (id) {
            return {
                id,
            };
        }
        return null;
    }

    function isHost(req) {
        return req.user.host && req.user.host.auth;
    }

    router.post("/queue-track", (req, res) => {
        console.log(
            `soMeBodyY (user "${req.user.username}" waTNTS to UQUE a song!!!`,
            req.body.trackId,
        );

        req.snoppifyHost.controller
            .queueTrack(req.user.username, req.body.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/dequeue-track", (req, res) => {
        req.snoppifyHost.controller
            .dequeueTrack(req.user.username, req.body.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/vote", (req, res) => {
        req.snoppifyHost.controller
            .vote(req.user.username, req.body.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/unvote", (req, res) => {
        req.snoppifyHost.controller
            .unvote(req.user.username, req.body.trackId)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/search", (req, res) => {
        let query = checkStr(req.query.query) || "";

        if (query == "") {
            return res.send({
                tracks: {
                    items: [],
                },
            });
        }

        const extractedId = extractId(query);

        const snoppifyHost = req.snoppifyHost;

        if (extractedId) {
            snoppifyHost.api
                .getTracks([extractedId])
                .then(data => {
                    let track = data.body.tracks[0],
                        queueTrack = snoppifyHost.controller.queue.get(track);

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
            snoppifyHost.api
                .searchTracks(query)
                .then(data => {
                    data.body.tracks.items = data.body.tracks.items.map(
                        track => snoppifyHost.controller.queue.get(track) || track,
                    );

                    res.send(data.body);
                })
                .catch(errorHandler(res));
        }
    });

    router.get("/search-parties", (req, res) => {
        if (!isHost(req)) {
            res.status(401).end();
            return;
        }

        let data = {
            query: "",
            result: [],
        };

        if (!req.user.parties) {
            res.send(data);
            return;
        }

        let query = req.query.query ? (req.query.query as string).trim().toLowerCase() : "";
        let querySplit = query.split(/\s+/);

        data.result = req.user.parties;

        if (query != "") {
            data.result = req.user.parties.map(party => {
                var name = party.name.toLowerCase();
                let p = {
                    id: party.id,
                    name: party.name,
                    score: 0,
                };
                p.score = querySplit.map(val => {
                    return name.search(val) != -1 ? 1 : 0;
                }).reduce((a, b) => a + b, 0);
                return p;
            });
        }

        data.result = data.result.filter(party => {
            return typeof party.score == 'undefined' ? true : party.score > 0;
        });

        data.result.sort((a, b) => {
            return a.score - b.score;
        });

        res.send(data);
    });

    router.post("/set-party", (req, res) => {
        if (!isHost(req)) {
            res.status(401).end();
            return;
        }

        if (!req.user.parties) {
            res.status(404).end();
            return;
        }

        var party = req.user.parties.find(p => {
            return p.id == req.body.id;
        });
        if (!party) {
            res.status(404).end();
            return;
        }

        req.snoppifyHost.controller
            .setParty(party)
            .then(data => {
                req.user.host.id = party.id;
                req.user.host.name = party.name;

                User.save(req.user, () => {
                    res.send(data);
                });

            })
            .catch(errorHandler(res));
    });

    router.post("/set-party-name", (req, res) => {
        if (!isHost(req)) {
            res.status(401).end();
            return;
        }

        req.snoppifyHost.controller
            .updateMainPlaylist(req.body)
            .then(data => {
                req.user.host.name = data.name;

                var party = req.user.parties.find(p => {
                    return p.id == req.user.host.id;
                });
                if (party) {
                    party.name = data.name;
                }

                User.save(req.user, () => {
                    res.send(data);
                });

            })
            .catch(errorHandler(res));
    });

    router.post("/set-backup-playlist", (req, res) => {
        if (!isHost(req)) {
            res.status(401).end();
            return;
        }

        if (!req.body.uri) {
            // unset backup playlist
            spotify.controller
                .removeBackupPlaylist();

            res.status(200).end();
            return;
        }

        const playlist = extractPlaylistId(req.body.uri);

        if (!playlist) {
            res.status(400).end();
            return;
        }

        spotify.controller
            .setBackupPlaylist({ id: playlist.id })
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/set-active-device", (req, res) => {
        spotify.playbackAPI
            .setActiveDevice(req.body.id)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-devices", (req, res) => {
        spotify.playbackAPI
            .getDevices()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-track", (req, res) => {
        spotify.controller
            .getTrack(checkStr(req.query.trackId))
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-playlists", (req, res) => { });

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
            party: spotify.controller.getCurrentParty(),
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

    router.get("/get-host-playlists", (req, res) => {
        spotify.api
            .getUserPlaylists("me", {
                limit: +req.query.limit || 15,
                offset: req.query.offset === undefined ? 0 : +req.query.offset,
            })
            .then(playlistRes => {
                res.json(playlistRes.body.items);
            })
            .catch(err => {
                res.json(err);
            })
            .finally(() => res.send());
    });

    router.get("/auth", (req, res) => {
        // if user is authenticated in the session, carry on

        if (req.isAuthenticated() && req.user) {
            const spotify = getSnoppifyHost(req.user.partyId);

            if (!spotify.initialized && req.user.host && req.user.host.status == 'success') {
                if (!req.session.spotify) {
                    console.log("could not initialize");
                } else {
                    // Set the access token on the API object to use it in later calls
                    spotify.api.setAccessToken(req.session.spotify.access_token);
                    spotify.api.setRefreshToken(req.session.spotify.refresh_token);

                    // spotify.init(req);

                    if (req.user.host.id) {
                        spotify.controller.setParty(req.user.host);
                    }
                }
            }

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
    router.get("/logout", function (req, res) {
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
            state: JSON.stringify(getPassportState(req)),
        })(req, ...args),
    );

    // handle the callback after facebook has authenticated the user
    // new test callback that looks more like the spotify one
    router.get(
        "/auth/facebook/callback",
        passport.authenticate("facebook", { failureRedirect: "/new-user", }),
        (req, res, next) => {
            req.session.host = null;
            req.user.partyId = req.query.partyId;

            console.log("Authed FACEBOOK user: ", req.user, req.query);

            res.redirect("/party");
            next();
        }
    );

    // route for spotify authentication and login
    // different scopes while logging in
    router.get("/auth/spotify", (req, ...args) =>
        passport.authenticate("spotify", {
            scope: ["user-read-email", "user-read-private"],
            state: JSON.stringify(getPassportState(req)),
        })(req, ...args),
    );

    // authenticate host and create party
    router.get("/auth/spotify-host", (req, ...args) =>
        // TODO: deprecate
        passport.authenticate("spotify", {
            scope: spotifyAPIScopes,
            state: JSON.stringify(getPassportState(req, "/host")),
            successRedirect: "/host",
            failureRedirect: "/host",
        })(req, ...args),
    );

    // authenticate host
    router.get("/auth/spotify-host-login", (req, ...args) =>
        passport.authenticate("spotify", {
            scope: spotifyAPIScopes,
            state: JSON.stringify(getPassportState(req, "/host-login")),
            successRedirect: "/host",
            failureRedirect: "/host",
        })(req, ...args),
    );

    // handle the callback after spotify has authenticated the user
    router.get(
        "/auth/spotify/callback",
        passport.authenticate("spotify", { failureRedirect: "/new-user", }),
        (req, res, next) => {
            req.session.host = null;
            console.log(req.query.state);
            try {
                const data = JSON.parse(req.query.state as any);
                console.log(data);
                req.user.partyId = data.id;
            } catch (e) { }

            console.log("Authed SPOTIFY user: ", req.user, req.query);

            res.redirect("/party");
            next();
        },
    );

    // handle the callback after spotify has authenticated the user
    router.get(
        "/host/auth/spotify/callback",
        passport.authenticate("spotify", {
            scope: spotifyAPIScopes,
            failureRedirect: "/host",
        }),
        function (req, res, next) {
            if (!req.user.host) {
                req.user.host = {};
            }
            req.user.host.auth = true;
            req.user.host.status = 'pending';

            res.redirect('/create-spotify-host');
        }
    );

    // handle the callback after spotify has authenticated the user
    router.get(
        "/host-login/auth/spotify/callback",
        passport.authenticate("spotify", {
            scope: spotifyAPIScopes,
            failureRedirect: "/host",
        }),
        function (req, res, next) {
            if (!req.user.host) {
                req.user.host = {};
            }
            req.user.host.auth = true;
            req.user.host.status = 'pending';

            User.save(req.user, (err, data) => {
                res.redirect('http://' + getPassportState(req, '/authenticate-spotify-host').address);
            });
        }
    );

    router.post("/wifi", (req, res, next) => {
        if (!isHost(req)) {
            res.status(401);
            return res.json({ error: "You need to be host!" });
        }

        const party = spotify.controller.getCurrentParty();
        if (!party) {
            res.status(500);
            return res.json({ error: "No party file/object" });
        }

        party.wifi = req.body;
        res.send(`WIFI:S:${party.wifi.ssid};T:${party.wifi.encryption};P:${party.wifi.password};;`);
    });

    router.get("/wifi", (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(403).end();
        }

        const wifi = spotify.controller.getCurrentParty()?.wifi;
        if (!wifi) {
            //return res.status(500).json({ error: "No wifi in the party object" });
            res.send(null);
            return;
        }

        res.send(`WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};;`);
    });

    return router;
}
