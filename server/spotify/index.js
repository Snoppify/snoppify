const spotify = {
    api: require("./spotify-api"),
    playbackAPI: require("./spotify-playback-api"),
    controller: require("./spotify-controller"),
    init: () => {
        spotify.api.init();
        spotify.controller.init();
    }
};

module.exports = spotify;