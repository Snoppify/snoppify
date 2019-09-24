import appRootPath from "app-root-path";
import bodyParser from "body-parser";
import connectLoki from "connect-loki";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { Request as ExpRequest } from "express";
import fallback from "express-history-api-fallback";
import session from "express-session";
import sharedsession from "express-socket.io-session";
import fs from "fs";
import http from "http";
import https from "https";
import ip from "ip";
import minimist from "minimist";
import passport from "passport";

import socketIO from "./socket";
import spotify from "./spotify";

//@ts-ignore
dotenv.config();

const app = express();

const LokiStore = connectLoki(session);
const args = minimist(process.argv);

// consts
const rootDir = appRootPath + "/dist";

const useHttps = true;
let httpServer: https.Server | http.Server;
if (useHttps) {
    console.log("starting using https");
    httpServer = https.createServer(
        {
            key: fs.readFileSync(appRootPath + "/ssl/privatekey.key"),
            cert: fs.readFileSync(appRootPath + "/ssl/certificate.crt"),
        },
        app,
    );
} else {
    httpServer = http.createServer(app);
}

const socket = socketIO(httpServer);

const cookieparser = cookieParser();

// save this, don't know if it can be useful in teh future
app.use(function(req, res, next) {
    let ipAddr = ip.address();
    var localhost = ipAddr + ":3000";
    var remotehost = "http://snoppify.com";
    var host = req.get("origin") || req.get("host");
    res.header("Access-Control-Allow-Origin", host);
    //res.header("Access-Control-Allow-Origin", "*");
    // switch (host) {
    //     case localhost:
    //     case remotehost:
    //         break;
    //     default:
    //         console.log("Rejected origin " + host);
    //         break;
    // }
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
    store: sessionStore = new LokiStore({
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
    return (req: ExpRequest) => {
        if (isHosting) {
            return;
        }

        isHosting = true;
        spotify.init(req);
    };
})();
app.use("/start-host", (req, res) => {
    startHosting(req);
    res.send("host started");
});

app.use("/ping", (_, res) => {
    res.json({
        isHost: true,
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
    let ipAddr = ip.address();

    console.log(`Serving http${useHttps ? "s" : ""}://${ipAddr}:${port}`);

    // send message to electron app
    process.send && process.send("SERVER_STARTED");
});
