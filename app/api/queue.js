module.exports = (axios) => ({
    queueTrack: function(trackId) {
        return axios.post("/queue-track", {
            trackId
        });
    },
    dequeueTrack: function(trackId) {
        return axios.post("/dequeue-track", {
            trackId
        });
    },
    vote: function(trackId) {
        return axios.post("/vote", {
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
    },
    emptyQueue: function() {
        return axios.post("/empty-queue");
    },
    get: function() {
        return axios.get("/get-queue");
    }
});