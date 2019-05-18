export default axios => ({
    info: () => axios.get("/info"),
    playSound: sound =>
        axios.post("/play-sound", {
            sound,
        }),
});
