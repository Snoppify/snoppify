import * as fs from "fs";
import mkdirp from "mkdirp";

import { SpotifyAPI } from "./spotify-api";

const socket = require("../socket");
// const api = require("./spotify-api");
const playbackAPI = require("./spotify-playback-api");
const states = require("./spotify-states.js");

// const fs = require("fs");
// const mkdirp = require("mkdirp");

const User = require("../models/user");
const Queue = require("../Queue");

/////////////////////

let api: SpotifyAPI;

let queue = new Queue({
    id: "id",
});
let history = new Queue({
    id: "id",
});
let backupQueue = new Queue({
    id: "id",
});

let backupPlaylist: any = null;

const pollTimeout = 2000;
const maxQueueSize = 5;

let playlist: any = null;
let queueFile = "";

const init = (_api: SpotifyAPI) => {
    api = _api;

    mkdirp.sync("data");
    queueFile = "data/snoppify-queue.json";

    // load saved queue
    fs.readFile(queueFile, "utf8", function readFileCallback(err, data) {
        if (err) {
            return;
        }
        try {
            let obj = JSON.parse(data);

            obj.queue.forEach(function(track: any) {
                queue.add(track);
            });

            if (obj.currentTrack) {
                history.add(obj.currentTrack);
            }

            if (obj.backupPlaylist) {
                backupPlaylist = obj.backupPlaylist;
            }
        } catch (e) {
            console.log(e);
            return;
        }
    });

    api.onload.then(function(data) {
        reloadPlaylist();

        if (backupPlaylist) {
            setBackupPlaylist(backupPlaylist.owner.id, backupPlaylist.id);
        }

        if (api.config.refresh_token) {
            setInterval(function() {
                pollPlayerStatus();
            }, pollTimeout);
        }
    });

    states.after(function() {
        // clear events
        for (var ev in states.data.events) {
            states.data.events[ev] = false;
        }
    });

    states.on("paused", function(s: any) {
        console.log(s.name);
        sendEvent(s.name, {
            track: getCurrentTrack(),
        });
    });

    states.on("playing", function(s: any) {
        console.log(s.name);
        sendEvent(s.name, {
            track: getCurrentTrack(),
        });
    });

    states.on("playSong", function(s: any) {
        console.log(s.name);

        let track = getCurrentTrack();

        if (track && track.snoppify) {
            let sock = socket.sockets[track.snoppify.issuer.username];
            if (sock) {
                sock.emit("event", {
                    type: "playMySong",
                    data: {
                        track,
                    },
                });
            }
        }

        sendEvent(s.name, {
            track: track,
        });

        saveQueue();
    });

    states.on("waitingForNextSong", function(s: any) {
        console.log(s.name);

        playNextTrack();
    });

    states.start();
};

export default {
    init,
    get queue() {
        return queue;
    },
    get isPlaying() {
        return states.data.isPlaying;
    },
    queueTrack,
    vote,
    unvote,
    dequeueTrack,
    playNext,
    play,
    pause,
    next,
    previous,
    emptyPlaylist,
    emptyQueue,
    getQueue,
    getCurrentTrack,
    getTrack,
    getBackupPlaylist,
    setBackupPlaylist,
};

//////////////////

function queueTrack(user: any /* User */, trackId: string) {
    return new Promise(function(resolve, reject) {
        api.getTracks([trackId])
            .then(r => {
                let track = r.body.tracks[0];
                getUserData(user, function(err: any, userData: any) {
                    if (err) {
                        return reject(err);
                    }

                    if (!track) {
                        return reject({
                            response: {
                                status: 404,
                                statusText: "Track not found",
                            },
                        });
                    }

                    if (queue.get(trackId)) {
                        return reject({
                            response: {
                                status: 400,
                                statusText: "Track already added",
                            },
                        });
                    }

                    if (userData.queue.get(trackId)) {
                        return reject({
                            response: {
                                status: 400,
                                statusText: "You have already added this track",
                            },
                        });
                    }

                    if (userData.queue.size == maxQueueSize) {
                        return reject({
                            response: {
                                status: 400,
                                statusText:
                                    "You cannot add more than " +
                                    maxQueueSize +
                                    " tracks",
                            },
                        });
                    }

                    track.snoppify = {
                        issuer: userData,
                        votes: [],
                        timestamp: Date.now(),
                    };

                    // TODO: check if queue is empty and if track should be playing?
                    queue.add(track);
                    userData.queue.add({
                        id: track.id,
                    });

                    rebuildQueueOrder();

                    states.data.events.queuedTrack = true;

                    states.update();

                    socket.io.local.emit("queue", {
                        queue: queue.queue,
                        addedTracks: [track],
                        removedTracks: [],
                    });

                    saveQueue();
                    saveUsers();

                    resolve(track);
                });
            })
            .catch(reject);
    });
}

function dequeueTrack(user: any /* User */, trackId: string) {
    return new Promise(function(resolve, reject) {
        // TODO: check if playing?
        let track = queue.get(trackId);
        getUserData(user, function(err: any, userData: any) {
            if (err) {
                return reject(err);
            }

            if (!track || track.snoppify.issuer.username != user) {
                return reject({
                    response: {
                        status: 404,
                        statusText: "Track not found",
                    },
                });
            }

            if (!queue.remove(track)) {
                return reject({
                    response: {
                        status: 500,
                        statusText: "Track could not be removed",
                    },
                });
            }

            userData.queue.remove(track);

            states.data.events.dequeuedTrack = true;

            states.update();

            socket.io.local.emit("queue", {
                queue: queue.queue,
                addedTracks: [],
                removedTracks: [track],
            });

            saveQueue();
            saveUsers();

            resolve();
        });
    });
}

function vote(user: any, trackId: any) {
    return new Promise(function(resolve, reject) {
        let track = queue.get(trackId);

        if (!track) {
            return reject({
                response: {
                    status: 404,
                    statusText: "No such track",
                },
            });
        }

        if (track.snoppify.votes.indexOf(user) != -1) {
            return reject({
                response: {
                    status: 400,
                    statusText: "You have already voted",
                },
            });
        }

        track.snoppify.votes.push(user);

        rebuildQueueOrder();

        saveQueue();

        states.data.events.userVoted = true;

        states.update();

        socket.io.local.emit("queue", {
            queue: queue.queue,
            addedTracks: [],
            removedTracks: [],
        });
        sendEvent("vote", {
            track: track,
            votes: track.snoppify.votes.length,
        });

        resolve();
    });
}

function unvote(user: any, trackId: any) {
    return new Promise(function(resolve, reject) {
        let track = queue.get(trackId);

        if (!track) {
            return reject({
                response: {
                    status: 404,
                    statusText: "No such track",
                },
            });
        }

        let i = track.snoppify.votes.indexOf(user);
        if (i != -1) {
            track.snoppify.votes.splice(i, 1);
        }

        rebuildQueueOrder();

        saveQueue();

        states.data.events.userVoted = true;

        states.update();

        socket.io.local.emit("queue", {
            queue: queue.queue,
            addedTracks: [],
            removedTracks: [],
        });
        sendEvent("unvote", {
            track: track,
            votes: track.snoppify.votes.length,
        });

        resolve();
    });
}

function getBackupPlaylist() {
    // console.log(backupPlaylist);
    return backupPlaylist;
}

function setBackupPlaylist(userId: string, id: string) {
    return new Promise((resolve, reject) => {
        api.getPlaylist(userId, id)
            .then(data => {
                backupQueue = new Queue({
                    id: "id",
                    queue: data.body.tracks.items.map((track: any) => {
                        track.track.snoppify = {
                            issuer: {
                                id: "1337",
                                username: "1337",
                                displayName: "Snoppify Bot",
                                profile:
                                    "https://f29682d3f174928942ed-2ffcea2cbcb9e3aa51fd8a91e66dd2e9.ssl.cf2.rackcdn.com/1410771548.09_avatar.png",
                            },
                            votes: [],
                        };
                        return track.track;
                    }),
                });

                delete data.body.tracks;
                console.log("set");
                backupPlaylist = data.body;

                saveQueue();

                sendEvent("backupPlaylist", {
                    playlist: backupPlaylist,
                });

                resolve();
            })
            .catch(r => {
                console.log(r);
                reject(r);
            });
    });
}

function playNext() {
    return new Promise((resolve, reject) => {
        playNextTrack().then(function() {
            next();
            resolve();
        });
    });
}

function playNextTrack() {
    return new Promise((resolve, reject) => {
        let track = queue.next();

        if (!track) {
            if (backupPlaylist) {
                track = backupQueue.nextRandomCursor();
            } else {
                track = getCurrentTrack();
            }
        }
        addToPlaylist(track)
            .then(r => {
                if (track) {
                    // save issuer for later
                    history.add(track);
                }

                saveQueue();
                if (track && track.snoppify) {
                    getUserData(track.snoppify.issuer.username, function(
                        err: any,
                        userData: any,
                    ) {
                        if (userData) {
                            userData.queue.remove(track.id);
                            saveUsers();
                        }
                    });
                }

                sendEvent("waitingForNextSong", {
                    track: track,
                });

                if (track) {
                    socket.io.local.emit("queue", {
                        queue: queue.queue,
                        addedTracks: [],
                        removedTracks: [track],
                    });
                }

                if (
                    states.data.playlist &&
                    states.data.playlist.tracks.items.length == 0
                ) {
                    // BUG: cant start a playlist that havent been intereacted with from a spotify client,
                    // for example after emptying the playlist
                    //play(true);
                }

                resolve(r);
            })
            .catch(r => {
                reject(r);
            });
    });
}

function play(playPlaylist = false) {
    let data = {} as any;
    if (playPlaylist) {
        data.playlist = playlist.id;
    }
    return playbackAPI.play(data);
}

function pause() {
    return playbackAPI.pause();
}

function next() {
    return playbackAPI.next();
}

function previous() {
    return playbackAPI.previous();
}

function emptyPlaylist() {
    let promises = [];
    for (let i = 0; i < playlist.tracks.items.length; i += 100) {
        let positions = (playlist.tracks.items as any[])
            .slice(i, i + 100)
            .map((_, _i) => i + _i);
        let p = playbackAPI.removePositionsFromPlaylist(
            api.config.owner,
            playlist.id,
            positions,
            playlist.snapshot_id,
        );
        promises.push(p);
    }
    return Promise.all(promises).then(function() {
        reloadPlaylist();
    });
}

function emptyQueue() {
    return new Promise((resolve, reject) => {
        let removed = queue.queue;

        queue.clear();

        socket.io.local.emit("queue", {
            queue: queue.queue,
            addedTracks: [],
            removedTracks: removed,
        });

        resolve();
    });
}

function getQueue() {
    return queue.queue;
}

function getTrack(trackId: string) {
    return new Promise((resolve, reject) => {
        let track = queue.get(trackId);
        Promise.all([
            track
                ? new Promise(_resolve => {
                      _resolve({
                          body: {
                              tracks: [track],
                          },
                      });
                  })
                : api.getTracks([trackId]),
            api.getAudioFeaturesForTracks([trackId]),
        ])
            .then((data: any[]) => {
                let track = data[0].body.tracks[0];
                track.audio_features = data[1].body.audio_features[0];

                resolve(track);
            })
            .catch(data => {
                reject(data);
            });
    });
}

/////////////////////

function reloadPlaylist() {
    api.getPlaylist(api.config.owner, api.config.playlist).then(
        function(data) {
            playlist = data.body;

            states.data.playlist = playlist;

            states.update();
        },
        function(err) {
            console.log("Playlist not found");
        },
    );
}

function addToPlaylist(track: string | { uri: string }) {
    return new Promise((resolve, reject) => {
        if (track) {
            let uri =
                typeof track == "string" ? "spotify:track:" + track : track.uri;
            playbackAPI
                .addToPlaylist(api.config.owner, playlist.id, [uri])
                .then(function() {
                    reloadPlaylist();
                    resolve();
                })
                .catch(function(r: any) {
                    console.log(r.response.data);
                    reject(r);
                });
        } else {
            reject();
        }
    });
}

function pollPlayerStatus() {
    playbackAPI.currentlyPlaying().then(function(r: any) {
        let player = r.data;
        states.data.isPlaying = player.is_playing;

        // got new player
        if (!states.data.player) {
            if (player.is_playing) {
                states.data.events.startedPlaying = true;
            }
            if (!player.is_playing) {
                states.data.events.stoppedPlaying = true;
            }
            states.data.changedTrack = true;
        } else {
            // started/stopped playing
            if (states.data.player.is_playing != player.is_playing) {
                if (player.is_playing) {
                    states.data.events.startedPlaying = true;
                }
                if (!player.is_playing) {
                    states.data.events.stoppedPlaying = true;
                }
            }
            // changed track
            if (
                player.item &&
                (!states.data.player.item ||
                    states.data.player.item.id != player.item.id)
            ) {
                states.data.events.changedTrack = true;
            }
        }

        states.data.player = r.data;

        if (player) {
            let status = {
                progress: getTimeString(player.progress_ms),
                duration: "",
                fraction: 0,
            };
            if (player.item) {
                status.duration = getTimeString(player.item.duration_ms);
                status.fraction = player.progress_ms / player.item.duration_ms;
            }
            sendEvent("player", {
                isPlaying: player.is_playing,
                track: player.item,
                status: status,
            });
        }

        states.update();
    });
}

function getTimeString(ms: number) {
    let s = Math.floor(ms / 1000);
    let m = Math.floor(s / 60);
    s -= m * 60;
    return toNumberString(m) + ":" + toNumberString(s);
}

function toNumberString(n: number) {
    let s = "" + n;
    if (s.length == 1) {
        s = "0" + s;
    }
    return s;
}

function sendEvent(type: string, data: any) {
    if (!socket.io) {
        console.log("No socket");
        return;
    }
    socket.io.local.emit("event", {
        type: type,
        data: data || {},
    });
}

function getCurrentTrack() {
    if (states.data.player && states.data.player.item) {
        return history.get(states.data.player.item) || states.data.player.item;
    }
    return null;
}

/**
 * Earliest timestamp first
 */
function orderByTimestamp(a: any, b: any) {
    if (!a.snoppify || !b.snoppify) {
        return a.snoppify ? -1 : 1;
    }
    return a.snoppify.timestamp - b.snoppify.timestamp;
}

function rebuildQueueOrder() {
    let list: any[] = [];
    let maxVotes = -1;

    // fetch all tracks with votes with inital order by addition
    let tracks = true;
    let tracksCount = queue.size;
    for (let i = 0; i < queue.size; i++) {
        let sublist = [];
        for (let user in User.users) {
            let u = User.users[user];

            let t = u.queue.getAt(i);
            if (t) {
                let track = queue.get(t);

                if (track) {
                    sublist.push(track);

                    maxVotes = Math.max(
                        maxVotes,
                        track.snoppify ? track.snoppify.votes.length : 0,
                    );

                    tracksCount--;
                }
            }
        }
        sublist.sort(orderByTimestamp);
        list = list.concat(sublist);

        if (tracksCount <= 0) {
            break;
        }
    }

    // sort list by votes
    let index = 0;
    // iterate all votes
    for (let curVotes = maxVotes; curVotes >= 0; curVotes--) {
        // find next vote (from lowest safe index)
        for (let i = index; i < list.length; i++) {
            if (list[i].snoppify && list[i].snoppify.votes.length == curVotes) {
                // insert i at position index (shifting the array)
                let tmp = list.splice(i, 1);
                list.splice(index, 0, tmp[0]);
                index++;
            }
        }
    }

    queue.queue = list;
}

function saveQueue() {
    let json = JSON.stringify({
        currentTrack: getCurrentTrack(),
        queue: queue.queue,
        backupPlaylist,
    });
    fs.writeFile(queueFile, json, "utf8", function(err) {
        if (err) {
            console.log(err);
        }
    });
}

function getUserData(user: any, callback: (...args: any[]) => any) {
    User.find(user, callback);
}

function saveUsers() {
    User.save();
}