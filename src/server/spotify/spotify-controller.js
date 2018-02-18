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
    pause,
    next,
    previous,
    emptyPlaylist,
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

let playlist = null;

api.onload.then(function(data) {
    reloadPlaylist();

    if (api.config.refresh_token) {
        setInterval(function() {
            pollPlayerStatus();
        }, pollTimeout);
    }
});

function queueTrack(song) {
    // TODO: check if queue is empty and if song should be playing?
    queue.add(song);

    reloadPlaylist();
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

function play(playPlaylist = false) {
    let data = {};
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
        let positions = playlist.tracks.items.slice(i, i + 100).map((track, _i) => i + _i);
        let p = playbackAPI.removePositionsFromPlaylist(api.config.owner, playlist.id, positions, playlist.snapshot_id);
        promises.push(p);
    }
    return Promise.all(promises).then(function() {
        reloadPlaylist();
    });
}

/////////////////////

function reloadPlaylist() {
    api.getPlaylist(api.config.owner, api.config.playlist)
        .then(function(data) {
            playlist = data.body;

            // playlist.tracks.items.forEach(function(track) {
            //     queue.add(track);
            // });

            if (playlist.tracks.items.length == 0 && !queue.empty) {
                // TODO: state should transition to default playlist
                addToPlaylist(queue.next());

                if (!state.isPlaying) {
                    playbackAPI.play({
                        playlist: playlist.id,
                    });
                }
            }
        }, function(err) {
            console.log('Playlist not found');
        });
}

function addToPlaylist(track) {
    if (track) {
        let uri = track.track ? track.track.uri : "spotify:track:" + track;
        playbackAPI.addToPlaylist(api.config.owner, playlist.id, [uri]).then(reloadPlaylist);
        state.waitingForNextSong = true;

        console.log("queued next song: " + (track.track ? track.track.name : track));
    }
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
                    addToPlaylist(queue.next());
                }
            }
        }

        state.track = track;
    });
}