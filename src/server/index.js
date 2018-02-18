require('dotenv').config();

const express = require('express'),
    app = express(),
    session = require("express-session"),
    bodyParser = require("body-parser"),
    FileStore = require('session-file-store')(session);
const fs = require('fs');
const auth = require("./auth");

const http = require('http').Server(app);
const io = require('socket.io')(http);

const spotify = require('./spotify');

app.use(bodyParser.json());
app.enable("trust proxy");

auth.init(app, session, FileStore);

const fallback = require('express-history-api-fallback');
const rootDir = __dirname + '/../../public';

// Spotify refresh token end point
app.get("/refresh-token", (req, res) => {
    let refreshToken = "";
    let p = new Promise(function(resolve, reject) {
        if (req.query.code && req.query.state == "auth") {
            spotify.playbackAPI.getRefreshToken(req.query.code)
                .then(function(token) {
                    refreshToken = token;
                    resolve();
                })
                .catch(function(r) {
                    let e = [r.response.status, "(" + r.response.data.error + ")", r.response.data.error_description].join(" ");
                    console.log(e);
                    refreshToken = e;
                    resolve();
                });
        } else {
            resolve();
        }
    }).then(function() {
        fs.readFile(__dirname + "/refresh-token.html", 'utf8', (err, data) => {
            let authUrl = spotify.playbackAPI.getAuthUrl();
            data = data.replace(/{authUrl}/g, authUrl);
            data = data.replace(/{refreshToken}/g, refreshToken);
            res.send(data);
        });
    });
});

// html5 history api fix
app.use(express.static(rootDir));
app.use(fallback('index.html', {
    root: rootDir
}));

function successHandler(res) {
    return r => res.sendStatus(200);
}

function errorHandler(res) {
    return r => res.status(r.response.status).send({
        error: r.response.statusText
    });
}

app.post("/queue", (req, res) => {
    console.log(`soMeBodyY (user "${req.session.username}" waTNTS to UQUE a song!!!`, req.body.trackId);

    spotify.controller.queueTrack(req.body.trackId);

    res.sendStatus(200);
});

app.post("/play", (req, res) => {
    spotify.controller.play(req.body.playlist)
        .then(successHandler(res)).catch(errorHandler(res));
});

app.post("/pause", (req, res) => {
    spotify.controller.pause()
        .then(successHandler(res)).catch(errorHandler(res));
});

app.post("/next", (req, res) => {
    spotify.controller.next()
        .then(successHandler(res)).catch(errorHandler(res));
});

app.post("/previous", (req, res) => {
    spotify.controller.previous()
        .then(successHandler(res)).catch(errorHandler(res));
});

app.post("/empty-playlist", (req, res) => {
    spotify.controller.emptyPlaylist()
        .then(successHandler(res)).catch(errorHandler(res));
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

});

http.listen(3000, () => {

    let ip = require('ip').address();
    console.log(`Serving http://${ip}:3000`);
    console.log(`(Remember to set the environment variable 'export SERVER_IP=${ip}'\n`);

})

function extractId(string) {
    let id;

    [/spotify:track:(.+)/, /.?open.spotify.com\/track\/(.+)/].find(
        pattern => string.match(pattern) && (id = string.match(pattern)[1])
    );

    return id;
}