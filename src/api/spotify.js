export default axios => ({
    search: function(query = "") {
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
    createSpotifyHost(params) {
        return axios.get("/create-spotify-host", {
            params: params,
        });
    },
    authenticateSpotifyHost(params) {
        return axios.get("/authenticate-spotify-host", {
            params: params,
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
