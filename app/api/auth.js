module.exports = (axios) => ({
    auth() {
        return axios.get("/auth");
    },

    newUser(username) {
        return axios.post("/new-user", { username });
    },
});