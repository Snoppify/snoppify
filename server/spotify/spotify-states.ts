import { StateMachine } from "../StateMachine";

const nextTrackThreshold = 10;

export default new StateMachine<
    "paused" | "playing" | "playSong" | "waitingForNextSong",
    | "queuedTrack"
    | "dequeuedTrack"
    | "changedTrack"
    | "startedPlaying"
    | "stoppedPlaying"
    | "userVoted"
>({
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
        // waitingForNextSong
        {
            source: "waitingForNextSong",
            target: "playSong",
            condition: function (d) {
                return d.events.changedTrack;
            },
        },
        {
            source: "waitingForNextSong",
            target: "paused",
            condition: function (d) {
                return !d.isPlaying;
            },
        },
        // paused
        {
            source: "paused",
            target: "playSong",
            condition: function (d) {
                return d.events.changedTrack;
            },
        },
        {
            source: "paused",
            target: "playing",
            condition: function (d) {
                return d.isPlaying && !d.events.changedTrack;
            },
        },
        {
            source: "paused",
            target: "waitingForNextSong",
            condition: function (d) {
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
            condition: function (d) {
                return d.events.stoppedPlaying;
            },
        },
        {
            source: "playing",
            target: "playSong",
            condition: function (d) {
                return d.events.changedTrack;
            },
        },
        {
            source: "playing",
            target: "waitingForNextSong",
            condition: function (d) {
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
            condition: function (d) {
                return d.isPlaying;
            },
        },
    ],
    initialState: "paused",
    //finalState: "waitingForNextSong",
});
