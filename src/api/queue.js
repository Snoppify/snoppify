export default (axios) => ({
  setBackupPlaylist(uri) {
    return axios.post("/set-backup-playlist", {
      uri,
    });
  },
  queueTrack(trackId) {
    return axios.post("/queue-track", {
      trackId,
    });
  },
  dequeueTrack(trackId) {
    return axios.post("/dequeue-track", {
      trackId,
    });
  },
  vote(trackId) {
    return axios.post("/vote", {
      trackId,
    });
  },
  unvote(trackId) {
    return axios.post("/unvote", {
      trackId,
    });
  },
  play(playlist = false) {
    const data = {
      playlist,
    };
    return axios.post("/play", data);
  },
  pause() {
    return axios.post("/pause");
  },
  previous() {
    return axios.post("/previous");
  },
  playNext() {
    return axios.post("/play-next");
  },
  emptyPlaylist() {
    return axios.post("/empty-playlist");
  },
  emptyQueue() {
    return axios.post("/empty-queue");
  },
  get() {
    return axios.get("/get-queue");
  },
  searchParties(query) {
    return axios.get("/search-parties", {
      params: {
        query,
      },
    });
  },
  setParty(id) {
    return axios.post("/set-party", {
      id,
    });
  },
});
