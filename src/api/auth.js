// import Fingerprint2 from "fingerprintjs2";
// const fingerprint = new Promise(resolve => new Fingerprint2().get(fp => resolve(fp)));

export default axios => ({
    auth() {
        console.log("auth me please");
        return axios.get("/auth", {
            params: {},
        });
        // return fingerprint.then(fp =>
        //     axios.get("/auth", { params: { fp } })
        // );
    },

    newUser(username) {
        return axios.post("/new-user", {
            username,
        });
        // return fingerprint.then(fp =>
        //     axios.post("/new-user", { username, fp })
        // );
    },
});
