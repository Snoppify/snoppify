import * as fs from "fs";
import mkdirp from "mkdirp";

import User from "../models/user";
import Queue from "../Queue";
import socket from "../socket";
import { SpotifyAPI } from "./spotify-api";
import playbackAPI from "./spotify-playback-api";
import states from "./spotify-states";

// const api = require("./spotify-api");
// const fs = require("fs");
// const mkdirp = require("mkdirp");

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

let mainPlaylist: any = null;
let backupPlaylist: any = null;

const pollTimeout = 2000;
const maxQueueSize = 5;

let playlist: any = null;
let queueFile = "";
let partyFile = null;
let currentParty = null;

(function () {
    mkdirp.sync("data");
    queueFile = "data/snoppify-queue.json";

    // load saved queue
    fs.readFile(queueFile, "utf8", function readFileCallback(err, data) {
        if (err) {
            console.log("user init");
            User.init(() => { });
            saveQueue();
            return;
        }
        try {
            let obj = JSON.parse(data);

            obj.queue.forEach(function (track: any) {
                queue.add(track);
            });

            if (obj.currentTrack) {
                history.add(obj.currentTrack);
            }

            if (obj.mainPlaylist) {
                mainPlaylist = obj.mainPlaylist;
            }

            if (obj.backupPlaylist) {
                backupPlaylist = obj.backupPlaylist;
            }

            User.init(() => { });
            saveQueue();
        } catch (e) {
            console.log(e);
            return;
        }
    });
})();

const init = (_api: SpotifyAPI) => {
    api = _api;

    api.onload.then(function (data) {
        if (mainPlaylist) {
            setMainPlaylist({id: mainPlaylist.id});
        }

        if (backupPlaylist) {
            setBackupPlaylist({id: backupPlaylist.id});
        }

        if (mainPlaylist) {
            reloadPlaylist();
        }

        if (api.getCredentials().refreshToken) {
            setInterval(function () {
                pollPlayerStatus();
            }, pollTimeout);
        }
    });

    states.after(function () {
        // clear events
        for (var ev in states.data.events) {
            states.data.events[ev] = false;
        }
    });

    states.on("paused", function (s: any) {
        console.log(s.name);
        sendEvent(s.name, {
            track: getCurrentTrack(),
        });
    });

    states.on("playing", function (s: any) {
        console.log(s.name);
        sendEvent(s.name, {
            track: getCurrentTrack(),
        });
    });

    states.on("playSong", function (s: any) {
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

    states.on("waitingForNextSong", function (s: any) {
        console.log(s.name);

        playNextTrack();
    });

    states.start();
};

export default  {
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
    removeBackupPlaylist,
    setMainPlaylist,
    updateMainPlaylist,
    createMainPlaylist,
    setParty,
    getCurrentParty,
};

//////////////////

function setParty(party: any, opts?: any) {
    console.log("Party is this:");
    console.log(JSON.stringify(party, null, 2));
    
    return new Promise((resolve, reject) => {
        var filename = "data/snoppify-party-" + party.id + ".json";

        // load saved party
        fs.readFile(filename, "utf8", function readFileCallback(err, data) {
            // file does not exist
            if (err) {
                if (!opts || !opts.mainPlaylist) {
                    reject("A main playlist is required");
                    return;
                }

                console.log("saving new party " + party.name + " (" + party.id + ")");

                currentParty = party;
                partyFile = filename;
                mainPlaylist = opts.mainPlaylist;
                backupPlaylist = opts.backupPlaylist || null;

                saveQueue();

                resolve({
                    id: party.id,
                    queue: [],
                    mainPlaylist: mainPlaylist,
                    backupPlaylist: backupPlaylist,
                });
                return;
            }
            // file exist
            try {
                console.log("set party " + party.name + " (" + party.id + ")");

                currentParty = party;
                partyFile = filename;

                let obj = JSON.parse(data);

                queue.clear();
                obj.queue.forEach(function (track: any) {
                    queue.add(track);
                });

                // if (obj.currentTrack) {
                //     history.add(obj.currentTrack);
                // }

                if (obj.mainPlaylist) {
                    mainPlaylist = obj.mainPlaylist;
                }

                if (obj.backupPlaylist) {
                    backupPlaylist = obj.backupPlaylist;
                }

                User.init(() => { });

                saveQueue();

                resolve(obj);
            } catch (e) {
                reject(e);
            }
        });
    });
}

function getCurrentParty() {
    return currentParty;
}

function queueTrack(user: any /* User */, trackId: string) {
    return new Promise(function (resolve, reject) {
        api.getTracks([trackId])
            .then(r => {
                let track: SpotifyApi.TrackObjectFull & {
                    snoppify?: {
                        issuer: any;
                        votes: any[];
                        timestamp: number;
                    };
                } = r.body.tracks[0];

                getUserData(user, function (err: any, userData: any) {
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
    return new Promise(function (resolve, reject) {
        // TODO: check if playing?
        let track = queue.get(trackId);
        getUserData(user, function (err: any, userData: any) {
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
    return new Promise(function (resolve, reject) {
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

        // update friendships
        updateFriendship(track, user, 1);

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
    return new Promise(function (resolve, reject) {
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

        // update friendships
        updateFriendship(track, user, -1);

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

function updateFriendship(track, voterId, vote) {
    var issuerId = track.snoppify.issuer.id;

    // get voter
    User.find(voterId, (err, uVoter) => {
        if (err) return;

        if (!uVoter.votes.given[issuerId]) {
            uVoter.votes.given[issuerId] = 0;
        }
        uVoter.votes.given[issuerId] += vote;
        uVoter.votes.givenTotal += vote;

        // get issuer
        User.find(issuerId, (err, uIssuer) => {
            if (err) return;

            if (!uIssuer.votes.received[voterId]) {
                uIssuer.votes.received[voterId] = 0;
            }
            uIssuer.votes.received[voterId] += vote;
            uIssuer.votes.receivedTotal += vote;

            sendEvent("friend.vote", {
                user: uIssuer,
                voter: uVoter,
                votes: uIssuer.votes.received[voterId],
                vote,
            });

            var areFriends = !!uIssuer.friends.find(u => {
                return u.username == uVoter.username;
            });

            if (uIssuer.votes.received[voterId] >= 3 && !areFriends) {
                // new friends!
                uIssuer.friends.push({
                    username: uVoter.username,
                    displayName: uVoter.displayName,
                });
                uVoter.friends.push({
                    username: uIssuer.username,
                    displayName: uIssuer.displayName,
                });

                sendEvent("friend.new", {
                    user: uIssuer,
                    voter: uVoter,
                    votes: uIssuer.votes.received[voterId],
                });
            }

            User.save(uVoter, () => { });

            User.save(uIssuer, () => { });
        });
    });
}

function getBackupPlaylist() {
    // console.log(backupPlaylist);
    return backupPlaylist;
}

function createMainPlaylist(name: string) {
    return new Promise((resolve, reject) => {
        api.createPlaylist(api.config.owner, name, {
            public: true
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                delete data.body.tracks;
                mainPlaylist = data.body;

                saveQueue();

                sendEvent("mainPlaylist", {
                    playlist: mainPlaylist,
                });

                resolve(data.body);
            }
        });
    });
}

function setMainPlaylist({id}: { id: string}) {
    return new Promise((resolve, reject) => {
        api.getPlaylist(id)
            .then(data => {
                delete data.body.tracks;
                mainPlaylist = data.body;

                saveQueue();

                sendEvent("mainPlaylist", {
                    playlist: mainPlaylist,
                });

                resolve();
            })
            .catch(r => {
                console.log(r);
                reject(r);
            });
    });
}

function updateMainPlaylist(opts: { name: string; }): Promise<{ name?: string }> {
    if (!mainPlaylist) {
        return Promise.reject("ERR: No main playlist");
    }

    var params = {
        name: opts.name || mainPlaylist.name,
    };

    return api
        .changePlaylistDetails(mainPlaylist.id, params)
        .then(() => params);
}

function setBackupPlaylist({id}: {id: string}) {
    return new Promise((resolve, reject) => {
        api.getPlaylist(id)
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

                backupPlaylist = data.body;

                saveQueue();

                sendEvent("backupPlaylist", {
                    playlist: backupPlaylist,
                });

                resolve();
            }, r => {
                reject(r);
            });
    });
}

function removeBackupPlaylist() {
    backupPlaylist = null;

    saveQueue();

    sendEvent("backupPlaylist", {
        playlist: backupPlaylist,
    });
}

function playNext() {
    return new Promise((resolve, reject) => {
        playNextTrack().then(function () {
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
                    getUserData(track.snoppify.issuer.username, function (
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
    let playData = {} as any;
    if (playPlaylist) {
        playData.playlist = mainPlaylist ? mainPlaylist.id : api.config.playlist;

        return api.getPlaylist(playData.playlist).then(
            function (data) {
                playlist = data.body;

                states.data.playlist = playlist;

                states.update();

                if (playlist.tracks.total > 0) {
                    playData.position = playlist.tracks.total - 1;
                    return playbackAPI.play(playData);
                } else {
                    return playNext().then(function () {
                        return play(playPlaylist);
                    });
                }
            },
            function (err) {
                console.log("Playlist not found");
            },
        );
    } else {
        return playbackAPI.play();
    }
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
    if (playlist) {
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
    }
    return Promise.all(promises).then(function () {
        reloadPlaylist();
    });
}

function emptyQueue() {
    return new Promise((resolve, reject) => {
        let removed = queue.queue;

        queue.clear();

        for (let user in User.users) {
            let u = User.users[user];
            u.clear();
        }

        saveQueue();
        saveUsers();

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
                ? Promise.resolve({
                    body: { tracks: [track] as SpotifyApi.TrackObjectFull[], },
                })
                : api.getTracks([trackId]),
            api.getAudioFeaturesForTracks([trackId]),
        ])
            .then((data) => {
                let track: SpotifyApi.TrackObjectFull & {
                    audio_features?: SpotifyApi.AudioFeaturesObject;
                } = data[0].body.tracks[0];

                // console.log(JSON.stringify(track, null, 2));
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
    return api.getPlaylist(mainPlaylist ? mainPlaylist.id : api.config.playlist).then(
        function (data) {
            playlist = data.body;

            states.data.playlist = playlist;

            states.update();
        },
        function (err) {
            console.log("Playlist not found");
        },
    );
}

function addToPlaylist(track: string | { uri: string }) {
    playlist = mainPlaylist;
    
    return new Promise((resolve, reject) => {
        if (track) {
            let uri =
                typeof track == "string" ? "spotify:track:" + track : track.uri;
            playbackAPI
                .addToPlaylist(api.config.owner, playlist.id, [uri])
                .then(function () {
                    reloadPlaylist();
                    resolve();
                })
                .catch(function (r: any) {
                    console.log(r.response.data);
                    reject(r);
                });
        } else {
            reject();
        }
    });
}

function pollPlayerStatus() {
    return playbackAPI.currentlyPlaying().then(function (player) {
        states.data.isPlaying = player.is_playing;

        // got new player
        if (!states.data.player) {
            if (player.is_playing) {
                states.data.events.startedPlaying = true;
            }
            if (!player.is_playing) {
                states.data.events.stoppedPlaying = true;
            }
            // possible bug fixed: should be states.data.events.changedTrack?
            states.data.events.changedTrack = true;
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

        states.data.player = player;

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
    }).catch(function () {
        //
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
        mainPlaylist,
        backupPlaylist,
    });
    fs.writeFile(queueFile, json, "utf8", function (err) {
        if (err) {
            console.log(err);
        }
    });

    if (partyFile) {
        fs.writeFile(partyFile, json, "utf8", function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
}

function getUserData(user: any, callback: (...args: any[]) => any) {
    User.find(user, callback);
}

function saveUsers() {
    User.save();
}
