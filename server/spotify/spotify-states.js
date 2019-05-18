const StateMachine = require("../StateMachine");

const nextTrackThreshold = 10;

const stateMachine = new StateMachine({
    data: {
        isPlaying: false,
        //track: null,
        player: null,
        events: {
            queuedTrack: false,
            dequeuedTrack: false,
            changedTrack: false,
            startedPlaying: false,
            stoppedPlaying: false,
            userVoted: false,
        },
    },
    states: [
        {
            name: "paused",
        },
        {
            name: "playing",
        },
        {
            name: "playSong",
        },
        {
            name: "waitingForNextSong",
        },
    ],
    transitions: [
        // paused
        {
            source: "paused",
            target: "playSong",
            value: function(d) {
                return d.events.changedTrack;
            },
        },
        {
            source: "paused",
            target: "playing",
            value: function(d) {
                return d.isPlaying && !d.events.changedTrack;
            },
        },
        {
            source: "paused",
            target: "waitingForNextSong",
            value: function(d) {
                return (
                    d.events.queuedTrack &&
                    d.playlist &&
                    d.playlist.tracks.items.length == 0
                );
            },
        },
        // playing
        {
            source: "playing",
            target: "paused",
            value: function(d) {
                return d.events.stoppedPlaying;
            },
        },
        {
            source: "playing",
            target: "playSong",
            value: function(d) {
                return d.events.changedTrack;
            },
        },
        {
            source: "playing",
            target: "waitingForNextSong",
            value: function(d) {
                return (
                    d.player.is_playing &&
                    d.player.item &&
                    (d.player.item.duration_ms - d.player.progress_ms) / 1000 <
                        nextTrackThreshold
                );
            },
        },
        // playSong
        {
            source: "playSong",
            target: "playing",
            value: function(d) {
                return d.isPlaying;
            },
        },
        // waitingForNextSong
        {
            source: "waitingForNextSong",
            target: "playSong",
            value: function(d) {
                return d.events.changedTrack;
            },
        },
        {
            source: "waitingForNextSong",
            target: "paused",
            value: function(d) {
                return !d.isPlaying;
            },
        },
    ],
    initialState: "paused",
    //finalState: "waitingForNextSong",
});

module.exports = stateMachine;
