export default axios => ({
    setBackupPlaylist: function(uri) {
        return axios.post("/set-backup-playlist", {
            uri,
        });
    },
    queueTrack: function(trackId) {
        return axios.post("/queue-track", {
            trackId,
        });
    },
    dequeueTrack: function(trackId) {
        return axios.post("/dequeue-track", {
            trackId,
        });
    },
    vote: function(trackId) {
        return axios.post("/vote", {
            trackId,
        });
    },
    unvote: function(trackId) {
        return axios.post("/unvote", {
            trackId,
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
    playNext: function() {
        return axios.post("/play-next");
    },
    emptyPlaylist: function() {
        return axios.post("/empty-playlist");
    },
    emptyQueue: function() {
        return axios.post("/empty-queue");
    },
    get: function() {
        return axios.get("/get-queue");
    },
    searchParties: function(query) {
        return axios.get("/search-parties", {
            params: {
                query,
            },
        });
    },
    setParty: function(id) {
        return axios.post("/set-party", {
            id,
        });
    },
});
