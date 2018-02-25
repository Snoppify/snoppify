require('dotenv').config();

const express = require('express'),
    app = express(),
    session = require("express-session"),
    FileStore = require('session-file-store')(session),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser");
const fs = require('fs');
const auth = require("./auth");

const http = require('http').Server(app);

// the socket is initialized here
const socket = require('./socket')(http);
const io = socket.io;

const spotify = require('./spotify');

const fallback = require('express-history-api-fallback');

const passport = require('passport');

// consts
const rootDir = __dirname + '/../../public';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(cookieParser());
app.use(express.static(rootDir));

app.use(session({
    secret: 'spotify är sh1t, snoppify är bra!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
    },
    store: (sessionStore = new FileStore({
        ttl: 3600 * 24,
    })),
}));
app.use(passport.initialize());
app.use(passport.session());

// old session
//auth.init(app, session, FileStore);

require('./auth/passport')(passport);
//require('./auth/routes')(app, passport);

var routes = require('./routes/index')(passport, spotify);
app.use('/', routes);

/// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     console.log("404 req.originalUrl:", req.originalUrl);
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });


///////////

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
    const hostile = require('hostile');

    console.log(`Serving http://${ip}:3000`);
    console.log(`(Remember to set the environment variable 'export SERVER_IP=${ip}'\n`);

    let domain = ip;
    hostile.set(domain, 'snoppi.fy', function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('added: ' + domain);
        }
    });

})

function extractId(string) {
    let id;

    [/spotify:track:(.+)/, /.?open.spotify.com\/track\/(.+)/].find(
        pattern => string.match(pattern) && (id = string.match(pattern)[1])
    );

    return id;
}