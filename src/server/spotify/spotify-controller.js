let api = require("./spotify-api");
let playbackAPI = require("./spotify-playback-api");

let Queue = require('../Queue');

module.exports = {
    get queue() {
        return queue;
    },
    get isPlaying() {
        return state.isPlaying;
    },
    queueTrack,
    dequeueTrack,
    playNext,
    play,
    stop,
    pause,
    next,
    previous,
};

let state = {
    isPlaying: false,
    track: null,
    waitingForNextSong: false,
};
let queue = new Queue({
    id: "id",
});
let history = new Queue({
    id: "id",
});

let pollTimeout = 2000;
let nextTrackThreshold = 10;

let ownerId = "johnbrynte";
// snoppify playlist
let playlistId = "4aqgvSm1kYgFcsfyfSjcjQ";

let playlist = null;

api.onload.then(function(data) {
    api.getPlaylist(ownerId, playlistId)
        .then(function(data) {
            playlist = data.body;

            // playlist.tracks.items.forEach(function(track) {
            //     queue.add(track);
            // });
        }, function(err) {
            console.log('Playlist not found');
        });

    setInterval(function() {
        pollPlayerStatus();
    }, pollTimeout);
});

function queueTrack(song) {
    // TODO: check if queue is empty and if song should be playing?
    queue.add(song);
}

function dequeueTrack(song) {
    // TODO: check if playing?
    return queue.remove(song);
}

function playNext() {
    // TODO: play song
    let song = queue.next();
    history.add(song);
}

function play() {
    playbackAPI.play();
}

function stop() {
    playbackAPI.stop();
}

function pause() {
    playbackAPI.pause();
}

function next() {
    playbackAPI.next();
}

function previous() {
    playbackAPI.previous();
}

function pollPlayerStatus() {
    playbackAPI.currentlyPlaying().then(function(r) {
        state.isPlaying = r.data.is_playing;
        let track = r.data.item || null;

        if (state.isPlaying && track && state.track) {
            if (state.waitingForNextSong) {
                if (track.id != state.track.id) {
                    state.waitingForNextSong = false;
                }
            } else {
                let progress = r.data.progress_ms;
                let duration = state.track.duration_ms;
                if ((duration - progress) / 1000 < nextTrackThreshold) {
                    let next = queue.next();
                    let uri = typeof next == "string" ? "spotify:track:" + next : next.uri;
                    playbackAPI.addToPlaylist(ownerId, playlist.id, [uri]);
                    state.waitingForNextSong = true;

                    console.log("queued next song: " + next.track.name);
                }
            }
        }

        state.track = track;
    });
}