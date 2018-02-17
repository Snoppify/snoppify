require('dotenv').config();

const app = require('express')(),
    session = require("express-session"),
    bodyParser = require("body-parser"),
    FileStore = require('session-file-store')(session);
const auth = require("./auth");

const http = require('http').Server(app);
const io = require('socket.io')(http);

const spotify = require('./spotify');

app.use(bodyParser.json());
app.enable("trust proxy");

auth.init(app, session, FileStore);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on("connection", (socket) => {
    console.log("we got a live one" /*, socket*/ );

    socket.on("search", (string) => {
        const extractedId = extractId(string);

        if (extractedId) {
            spotify.api.getTracks([extractedId])
                .then(data => socket.emit("search", JSON.stringify({
                    tracks: {
                        items: data.body.tracks[0] ? [data.body.tracks[0]] : []
                    }
                })));
        } else {
            spotify.api.searchTracks(string)
                .then(data => socket.emit("search", JSON.stringify(data.body)));
        }
    });

    socket.on("getTrack", (id) => {
        Promise.all([
                spotify.api.getTracks([id]),
                spotify.api.getAudioFeaturesForTracks([id])
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

    socket.on("playSong", (id) => {
        spotify.controller.playSong(id);
    });

    socket.on("play", (id) => {
        spotify.controller.play();
    });

    socket.on("stop", (id) => {
        spotify.controller.stop();
    });

    socket.on("pause", (id) => {
        spotify.controller.pause();
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