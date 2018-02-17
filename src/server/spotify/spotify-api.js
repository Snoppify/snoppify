const SpotifyWebApi = require("spotify-web-api-node");

const api = new SpotifyWebApi({
    redirectUri: "http://localhost:3000/spotify-authorize",
    clientId: process.env.JOHN_CLIENT_ID,
    clientSecret: process.env.JOHN_CLIENT_SECRET,
});

const onloadDeferred = Promise.defer();

api.onload = onloadDeferred.promise;

api.clientCredentialsGrant().then(function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    api.setAccessToken(data.body['access_token']);

    onloadDeferred.resolve();
}, function(err) {
    console.log('Something went wrong when retrieving an access token', err);

    onloadDeferred.reject();
});

module.exports = api;