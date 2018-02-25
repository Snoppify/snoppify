module.exports = (axios) => ({
    search: function(query = "") {
        return axios.get("/search", {
            params: {
                query
            }
        });
    },
});