require("dotenv").config();

import express from "express";
import spotify from "./spotify";

const app = express();

const session = require("express-session"),
    FileStore = require("session-file-store")(session),
    sharedsession = require("express-socket.io-session"),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser");
const fs = require("fs");
const args = require("minimist")(process.argv);

// consts
const rootDir = require("app-root-path") + "/dist";

const useHttps = false;
let httpServer;
if (useHttps) {
    httpServer = require("https").createServer(
        {
            key: fs.readFileSync(
                require("app-root-path") + "/ssl/privatekey.key",
            ),
            cert: fs.readFileSync(
                require("app-root-path") + "/ssl/certificate.crt",
            ),
        },
        app,
    );
} else {
    httpServer = require("http").Server(app);
}

const socket = require("./socket")(httpServer);

const fallback = require("express-history-api-fallback");
const passport = require("passport");

const cookieparser = cookieParser();

// save this, don't know if it can be useful in teh future
app.use(function(req, res, next) {
    let ip = require("ip").address();
    var localhost = ip + ":3000";
    var remotehost = "http://snoppify.com";
    var host = req.get("origin") || req.get("host");
    switch (host) {
        case localhost:
        case remotehost:
            res.header("Access-Control-Allow-Origin", host);
            break;
        default:
            console.log("Rejected origin " + host);
            break;
    }
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept",
    );
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);
app.use(cookieparser);
app.use(express.static(rootDir));

let sessionStore;
let mysession = session({
    secret: "spotify är sh1t, snoppify är bra!",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
    },
    store: sessionStore = new FileStore({
        ttl: 3600 * 24,
    }),
});
app.use(mysession);
app.use(passport.initialize());
let passportsession = passport.session();
app.use(passportsession);

socket.io.use(sharedsession(mysession));

require("./auth/passport")(passport);
require("express-debug")(app, {});

var routes = require("./routes/index")(passport, spotify);
app.use("/", routes);
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
        isHost: isHosting,
    });
});

app.use(
    fallback("index.html", {
        root: rootDir,
    }),
);

/// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     console.log("404 req.originalUrl:", req.originalUrl);
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

///////////

socket.io.on("connection", (sock: any) => {
    console.log(
        "we got a live one",
        sock.id,
        (sock.handshake as any).session.passport,
    );

    // need to do " as any" since handshake.session is added by
    // express-socket.io or passport or something
    // if ((sock.handshake as any).session.passport) {
    //     sockets[(sock.handshake as any).session.passport.user] = sock;
    // }

    // comment this since it doesnt work anyways
    // sock.on("search", (string) => {
    //     const extractedId = extractId(string);

    //     if (extractedId) {
    //         spotify.api.getTracks([extractedId])
    //             .then(data => sock.emit("search", JSON.stringify({
    //                 tracks: {
    //                     items: data.body.tracks[0] ? [data.body.tracks[0]] : []
    //                 }
    //             })));
    //     } else {
    //         spotify.api.searchTracks(string)
    //             .then(data => sock.emit("search", JSON.stringify(data.body)));
    //     }
    // });

    sock.on("getTrack", (id: any) => {
        Promise.all([
            spotify.api.getTracks([id]),
            spotify.api.getAudioFeaturesForTracks([id]),
        ])
            .then(data => {
                var track = data[0].body.tracks[0];
                track.audio_features = data[1].body.audio_features[0];

                sock.emit("getTrack", JSON.stringify(track));
            })
            .catch(data => {
                sock.emit("getTrack", null);
            });
    });
});

const port = args.p || 3000;
httpServer.listen(port, () => {
    let ip = require("ip").address();

    console.log(`Serving http${useHttps ? "s" : ""}://${ip}:${port}`);
});
