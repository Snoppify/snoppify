/* global SpotifyApi */

import appRootPath from "app-root-path";
import bodyParser from "body-parser";
import connectLoki from "connect-loki";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import fallback from "express-history-api-fallback";
import session from "express-session";
import sharedsession from "express-socket.io-session";
import fs from "fs";
import http from "http";
import https from "https";
import ip from "ip";
import passport from "passport";
import { passportInit } from "./auth/passport";
import { PartyRepository } from "./models/Party/PartyRepository";
import { partyService } from "./models/Party/PartyService";
import { QueueRepository } from "./models/Queue/QueueRepository";
import { queueService } from "./models/Queue/QueueService";
import { UserRepository } from "./models/User/UserRepository";
import { userService } from "./models/User/UserService";
import routesIndex from "./routes";
import socketIO from "./socket";
import { getSnoppifyHost } from "./spotify";
import { getBackendSpotifyAPIClient } from "./spotify/spotify-api";
import { logger } from "./utils/snoppify-logger";

// @ts-ignore
dotenv.config();

const app = express();
const port = process.env.PORT || 80;

const LokiStore = connectLoki(session);

// consts
const rootDir = `${appRootPath}/dist`;

// data directory
if (!fs.existsSync("./data")) {
  fs.mkdirSync("./data");
}

userService.setRepository(new UserRepository());
queueService.setRepository(new QueueRepository());
partyService.setRepository(new PartyRepository());

const useHttps = false;
let httpServer: https.Server | http.Server;
if (useHttps) {
  httpServer = https.createServer(
    {
      key: fs.readFileSync(`${appRootPath}/ssl/privatekey.key`),
      cert: fs.readFileSync(`${appRootPath}/ssl/certificate.crt`),
    },
    app,
  );
} else {
  httpServer = http.createServer(app);
}

const socket = socketIO(httpServer);

const cookieparser = cookieParser();

// save this, don't know if it can be useful in teh future
app.use((req, res, next) => {
  const host = req.get("origin") || req.get("host");
  res.header("Access-Control-Allow-Origin", host);
  // res.header("Access-Control-Allow-Origin", "*");
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

const mysession = session({
  secret: "spotify är sh1t, snoppify är bra!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
  },
  store: new LokiStore({
    ttl: 3600 * 24,
  }) as any,
  // need to be `any` since LokiStore is not a complete store according
  // to TS
});
app.use(mysession);
app.use(passport.initialize());
const passportsession = passport.session();
app.use(passportsession);
socket.io.use(sharedsession(mysession));

app.use("*", (req, _, next) => {
  // add the host to the request
  req.snoppifyHost = getSnoppifyHost(req.user);
  next();
});

passportInit(passport);

app.use("/", routesIndex(passport));
// const isHosting = false;

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

/// ////////

socket.io.on("connection", (sock: any) => {
  logger.info(
    "we got a live one",
    sock.id,
    (sock.handshake as any).session.passport,
  );

  // console.log("SOCK SESSION:", sock.handshake.session);

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

  if (sock.handshake.session.passport) {
    userService.getUser(sock.handshake.session.passport.user).then((user) => {
      if (!user) {
        return;
      }
      sock.broadcast.emit("event", {
        type: "newUser",
        data: {
          displayName: user.displayName,
          profile: user.profile,
        },
      });
    });
  }

  sock.on("getTrack", (id: any) => {
    logger.info("SOCK SESSION:", sock.handshake.session);

    userService.getUser(sock.handshake.session.passport.user).then(() => {
      getBackendSpotifyAPIClient()
        .then((spotifyApi) =>
          Promise.all([
            spotifyApi.getTracks([id]),
            spotifyApi.getAudioFeaturesForTracks([id]),
          ]),
        )
        .then((data) => {
          const track: SpotifyApi.TrackObjectFull & {
            audio_features?: SpotifyApi.AudioFeaturesObject;
          } = data[0].body.tracks[0];

          track.audio_features = data[1].body.audio_features[0];

          sock.emit("getTrack", JSON.stringify(track));
        })
        .catch(() => {
          sock.emit("getTrack", null);
        });
    });
  });
});

httpServer.listen(port, () => {
  const ipAddr = ip.address();

  logger.log(`Serving http${useHttps ? "s" : ""}://${ipAddr}:${port}`);

  // send message to electron app
  if (process.send) {
    process.send("SERVER_STARTED");
  }
});
