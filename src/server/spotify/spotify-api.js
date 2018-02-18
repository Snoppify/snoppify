const SpotifyWebApi = require("spotify-web-api-node");

let config = {};

try {
    config = require("../../../snoppify-config.js");

    if (config.client_id && config.client_secret) {
        config.auth_token = new Buffer(config.client_id + ":" + config.client_secret).toString('base64');
    }
} catch (ex) {
    console.log("No snoppify config file");
}

const api = new SpotifyWebApi({
    redirectUri: "http://localhost:3000/refresh-token",
    clientId: config.client_id,
    clientSecret: config.client_secret,
});

api.config = config;

api.onload = new Promise(function(resolve, reject) {

    api.clientCredentialsGrant().then(function(data) {
        // Save the access token so that it's used in future calls
        api.setAccessToken(data.body['access_token']);

        resolve();
    }, function(err) {
        console.log('Something went wrong when retrieving an access token', err);

        reject();
    });

});

module.exports = api;