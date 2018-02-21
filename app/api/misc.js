module.exports = (axios) => ({
    info: () => axios.get("/info"),
});