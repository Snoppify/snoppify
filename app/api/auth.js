import Fingerprint2 from "fingerprintjs2";

const fingerprint = new Promise(resolve => new Fingerprint2().get(fp => resolve(fp)));

module.exports = (axios) => ({
    auth() {
        return fingerprint.then(fp =>
            axios.get("/auth", { params: { fp } })
        );
    },

    newUser(username) {
        return fingerprint.then(fp =>
            axios.post("/new-user", { username, fp })
        );
    },
});