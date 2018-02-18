module.exports = (axios) => ({
    queue: function(trackId) {
        return axios.post("/queue", { trackId });
    }
});