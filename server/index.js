require('dotenv').config();

const express = require('express'),
    app = express(),
    session = require("express-session"),
    FileStore = require('session-file-store')(session),
    sharedsession = require('express-socket.io-session'),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser");
const fs = require('fs');
const args = require('minimist')(process.argv);

const http = require('http').Server(app);

// the socket is initialized here
const socket = require('./socket')(http);
const io = socket.io;
const sockets = socket.sockets;

const spotify = require('./spotify');
const fallback = require('express-history-api-fallback');
const passport = require('passport');

// consts
const rootDir = require("app-root-path") + "/dist";

const cookieparser = cookieParser();


// save this, don't know if it can be useful in teh future
app.use(function (req, res, next) {
    let ip = require('ip').address();

    res.header("Access-Control-Allow-Origin", `http://localhost:3000`);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(cookieparser);
app.use(express.static(rootDir));

let mysession = session({
    secret: 'spotify är sh1t, snoppify är bra!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
    },
    store: (sessionStore = new FileStore({
        ttl: 3600 * 24,
    })),
});
app.use(mysession);
app.use(passport.initialize());
let passportsession = passport.session();
app.use(passportsession);

io.use(sharedsession(mysession));

require('./auth/passport')(passport);
require('express-debug')(app, {});

var routes = require('./routes/index')(passport, spotify);
app.use('/', routes);
let isHosting = false;

const startHosting = (() => {
    return () => {
        if (isHosting) {
            return;
        }

        isHosting = true;
        spotify.init();
    };
})();
app.use("/start-host", (_, res) => {
    startHosting();
    res.send("Host started");

});

app.use("/ping", (_, res) => {
    res.json({
        isHost: isHosting
    });
});

app.use(fallback('index.html', {
    root: rootDir
}));

/// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     console.log("404 req.originalUrl:", req.originalUrl);
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });


///////////

io.on("connection", (socket) => {
    console.log("we got a live one", socket.id, socket.handshake.session.passport);

    if (socket.handshake.session.passport) {
        sockets[socket.handshake.session.passport.user] = socket;
    }

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

const port = args.p || 3000;
http.listen(port, () => {
    let ip = require('ip').address();

    console.log(`Serving http://${ip}:${port}`);
    console.log(`(Remember to set the environment variable 'export SERVER_IP=${ip}'\n`);
});