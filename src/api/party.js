export default (axios) => ({
  start(name) {
    return axios.post("/start-party", {
      name,
    });
  },
  stop(name) {
    return axios.post("/stop-party", {
      name,
    });
  },
  setPartyName(name) {
    return axios.post("/set-party-name", {
      name,
    });
  },
  setBackupPlaylist(uri) {
    return axios.post("/set-backup-playlist", {
      uri,
    });
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
