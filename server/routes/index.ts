if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

import express, { Request as ExpressRequest } from "express";
import ip, { address } from "ip";
import { createSpotifyAPI } from "../spotify/spotify-api";

import codeWords from "../models/code-words";
import User from "../models/user";
import socket from "../socket";
import { createSnoppifyHost, getSnoppifyHost } from "../spotify";
import { spotifyAPIScopes } from "../spotify/spotify-playback-api";
import { PassportStatic } from "passport";

import routesAuthIndex from "./auth";

const spotifyAPI = createSpotifyAPI().init();

const getGlobalSnoppifyHost = () => getSnoppifyHost("asd");
// const spotifyPlaybackApi = new SpotifyPlaybackAPI(getGlobalSnoppifyHost().api);

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
        address: process.env.SERVER_URI + addressSuffix,
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

export default function (passport: PassportStatic) {
    // spotifyPlaybackApi.init(spotify.api);

    router.use(routesAuthIndex(passport));

    let tmp_host_data = {};

    // Spotify refresh token end point
    // NEW ROUTE
    router.get("/create-spotify-host", (req, res) => {
        if (req.query.code) {
            // callback from the spotify api
            spotifyAPI.authorizationCodeGrant(checkStr(req.query.code)).then(function (data) {
                const access_token = data.body['access_token'];
                const refresh_token = data.body['refresh_token'];

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
                    access_token: access_token,
                    refresh_token: refresh_token,
                };

                User.save(req.user, () => {
                    const snoppifyHost = createSnoppifyHost({
                        owner: req.user.username,
                        accessToken: checkStr(access_token),
                        refreshToken: checkStr(refresh_token),
                        hostId: id,
                    });

                    snoppifyHost.controller
                        .createMainPlaylist(hostData.name)
                        .then(function (playlist) {
                            console.log("Created new host");

                            snoppifyHost.controller.setParty(req.user.host, {
                                mainPlaylist: playlist,
                                backupPlaylist: null,
                            }).then(() => {
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
            }).catch(function () {
                console.log("callback from the spotify api FAILED");
                res.redirect(getPassportState(req, '/host?success=false').address);
            });

        } else {
            // return an auth url
            let url = spotifyAPI.createAuthorizeURL(spotifyAPIScopes, getPassportState(req, '/create-spotify-host').address);
            res.redirect(url);
        }
    });

    // Spotify refresh token end point
    // NEW ROUTE
    router.get("/authenticate-spotify-host", (req, res) => {
        if (req.query.code) {
            // callback from the spotify api
            spotifyAPI.authorizationCodeGrant(checkStr(req.query.code)).then(function (data) {
                const access_token = data.body['access_token'];
                const refresh_token = data.body['refresh_token'];

                req.session.spotify = {
                    access_token,
                    refresh_token,
                };

                if (!req.user) {
                    res.redirect(getPassportState(req, '/host?success=false').address);
                    return;
                }

                req.user.host = req.user.host || {};

                req.user.host.status = 'success';

                const snoppifyHost = createSnoppifyHost({
                    owner: req.user.username,
                    accessToken: checkStr(access_token),
                    refreshToken: checkStr(refresh_token),
                    hostId: "default", // this is a hack
                });

                req.session.spotify = {
                    access_token: access_token,
                    refresh_token: refresh_token,
                };

                User.save(req.user, () => {
                    if (req.user.host.id) {
                        snoppifyHost.controller.setParty(req.user.host)
                            .then(() => {
                                res.status(301).redirect(getPassportState(req, '/host').address);
                            }).catch(r => {
                                // Bad party, remove
                                // TODO: better party handling
                                delete req.user.host.id;
                                delete req.user.host.name;

                                User.save(req.user, () => {
                                    res.status(301).redirect(getPassportState(req, '/host').address);
                                });
                            });
                    } else {
                        res.status(301).redirect(getPassportState(req, '/host').address);
                    }
                });

            }).catch(function (r) {
                console.log(r);
                res.redirect(getPassportState(req, '/host?success=false').address);
            });

        } else {
            var url = spotifyAPI.createAuthorizeURL(spotifyAPIScopes, getPassportState(req, '/authenticate-spotify-host').address);
            res.status(301).redirect(url);
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
        return req.user.host && req.user.host.status === "success";
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
            getGlobalSnoppifyHost().controller
                .removeBackupPlaylist();

            res.status(200).end();
            return;
        }

        const playlist = extractPlaylistId(req.body.uri);

        if (!playlist) {
            res.status(400).end();
            return;
        }

        getGlobalSnoppifyHost().controller
            .setBackupPlaylist({ id: playlist.id })
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/set-active-device", (req, res) => {
        getGlobalSnoppifyHost().playbackAPI
            .setActiveDevice(req.body.id)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-devices", (req, res) => {
        const host = getGlobalSnoppifyHost();
        if (!host) {
            res.status(400).send();
            return;
        }
        host.playbackAPI
            .getDevices()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-track", (req, res) => {
        getGlobalSnoppifyHost().controller
            .getTrack(checkStr(req.query.trackId))
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-playlists", (req, res) => { });

    router.post("/play", (req, res) => {
        getGlobalSnoppifyHost().controller
            .play(req.body.playlist)
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/pause", (req, res) => {
        getGlobalSnoppifyHost().controller
            .pause()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/play-next", (req, res) => {
        getGlobalSnoppifyHost().controller
            .playNext()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/empty-playlist", (req, res) => {
        getGlobalSnoppifyHost().controller
            .emptyPlaylist()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.post("/empty-queue", (req, res) => {
        getGlobalSnoppifyHost().controller
            .emptyQueue()
            .then(successHandler(res))
            .catch(errorHandler(res));
    });

    router.get("/get-queue", (req, res) => {
        res.json({
            data: getGlobalSnoppifyHost().controller.getQueue(),
        });
    });

    router.get("/info", (req, res) => {
        const host = getGlobalSnoppifyHost();
        if (!host) {
            res.status(400).send();
            return;
        }
        res.json({
            party: host.controller.getCurrentParty(),
            queue: host.controller.getQueue(),
            currentTrack: host.controller.getCurrentTrack(),
            backupPlaylist: host.controller.getBackupPlaylist(),
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
        getGlobalSnoppifyHost().api
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

    router.post("/wifi", (req, res, next) => {
        if (!isHost(req)) {
            res.status(401);
            return res.json({ error: "You need to be host!" });
        }

        const party = getGlobalSnoppifyHost().controller.getCurrentParty();
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

        const wifi = getGlobalSnoppifyHost().controller.getCurrentParty()?.wifi;
        if (!wifi) {
            //return res.status(500).json({ error: "No wifi in the party object" });
            res.send(null);
            return;
        }

        res.send(`WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};;`);
    });

    return router;
}
