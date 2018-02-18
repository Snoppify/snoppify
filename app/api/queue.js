module.exports = (axios) => ({
    queue: function(trackId) {
        return axios.post("/queue", {
            trackId
        });
    },
    play: function(playlist = false) {
        let data = {
            playlist: playlist,
        };
        return axios.post("/play", data);
    },
    pause: function() {
        return axios.post("/pause");
    },
    previous: function() {
        return axios.post("/previous");
    },
    next: function() {
        return axios.post("/next");
    },
    emptyPlaylist: function() {
        return axios.post("/empty-playlist");
    }
});