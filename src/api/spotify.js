export default (axios) => ({
    search: function (query = "") {
        return axios.get("/search", {
            params: {
                query
            }
        });
    },
    getTrack(trackId) {
        return axios.get("/get-track", {
            params: {
                trackId
            }
        });
    },
});