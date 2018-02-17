require('dotenv').config();

const app = require('express')(),
    session = require("express-session"),
    bodyParser = require("body-parser");
const auth = require("./auth");

const http = require('http').Server(app);
const io = require('socket.io')(http);
const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.JOHN_CLIENT_ID,
    clientSecret: process.env.JOHN_CLIENT_SECRET,
});

spotifyApi.clientCredentialsGrant().then(function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
}, function(err) {
    console.log('Something went wrong when retrieving an access token', err);
});

app.use(bodyParser.json());
app.enable("trust proxy");

auth.init(app, session);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on("connection", (socket) => {
    console.log("we got a live one" /*, socket*/ );

    socket.on("search", (string) => {
        const extractedId = extractId(string);

        if (extractedId) {
            spotifyApi.getTracks([extractedId])
                .then(data => socket.emit("search", JSON.stringify({
                    tracks: {
                        items: data.body.tracks[0] ? [data.body.tracks[0]] : []
                    }
                })));
        }
        else {
            spotifyApi.searchTracks(string)
                .then(data => socket.emit("search", JSON.stringify(data.body)));
        }
    });

    socket.on("getTrack", (id) => {
        Promise.all([
                spotifyApi.getTracks([id]),
                spotifyApi.getAudioFeaturesForTracks([id])
            ])
            .then(data => {
                var track = data[0].body.tracks[0];
                track.audio_features = data[1].body.audio_features[0];

                socket.emit("getTrack", JSON.stringify(track));
            })
            .catch(data => {
                socket.emit("getTrack", null);
            });
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
})

function extractId(string) {
    let id;

    [/spotify:track:(.+)/, /.?open.spotify.com\/track\/(.+)/].find(
        pattern => string.match(pattern) && (id = string.match(pattern)[1])
    );

    return id;
}