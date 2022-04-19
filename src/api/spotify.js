export default (axios) => ({
  search(query = "") {
    return axios.get("/search", {
      params: {
        query,
      },
    });
  },
  getTrack(trackId) {
    return axios.get("/get-track", {
      params: {
        trackId,
      },
    });
  },
  setActiveDevice(id) {
    return axios.post("/set-active-device", {
      id,
    });
  },
  getDevices() {
    return axios.get("/get-devices");
  },
  setPartyName(name) {
    return axios.post("/set-party-name", {
      name,
    });
  },
});
