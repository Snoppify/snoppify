import express from "express";
import { PassportStatic } from "passport";
import User from "../models/user";
import socket from "../socket";
import { createSpotifyAPI } from "../spotify/spotify-api";
// import { spotifyAPIScopes } from "../spotify/spotify-playback-api";
import routesAuthIndex from "./auth";

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line global-require
  require("dotenv").config();
}

/* const spotifyAPI = */ createSpotifyAPI().init();

// const getGlobalSnoppifyHost = () => getSnoppifyHost(GLOBAL_SNOPPIFY_HOST_ID);
// const spotifyPlaybackApi = new SpotifyPlaybackAPI(getGlobalSnoppifyHost().api);

const router = express.Router();

// const isAuthenticated = function (req, res, next) {
//   // if user is authenticated in the session, call the next() to call the next request handler
//   // Passport adds this method to request object. A middleware is allowed to add properties to
//   // request and response objects
//   if (req.isAuthenticated()) return next();
//   // if the user is not authenticated then redirect him to the login page
//   res.redirect("/new-user");
// };

// const redirectIfAuthenticated = function (req, res, next) {
//   if (req.isAuthenticated()) return res.redirect("/party");
//   next();
// };

// const getPassportState = (req: ExpressRequest, addressSuffix = "") => ({
//   address: process.env.SERVER_URI + addressSuffix,
//   id: req.query.partyId,
// });

/**
 * Throws an error if the provided param is not a string. Used for
 * checking/asserting the type of e.g. parsed querystrings.
 * @param str
 */
const checkStr = (str: any) => {
  if (typeof str === "string") return str;
  throw new Error(`Not a string: ${JSON.stringify(str)}`);
};

export default function routes(passport: PassportStatic) {
  // spotifyPlaybackApi.init(spotify.api);

  router.use(routesAuthIndex(passport));

  function successHandler(res) {
    return (r) => res.status(200).send(r);
  }

  function errorHandler(res) {
    return (r) => {
      console.error("routes/index errorHandler:", res.body, r);

      if (!r || !r.response) {
        const status = r && r.status ? r.status : 500;
        return res.status(status).send(r);
      }
      return res.status(r.response.status).send({
        error: r.response.statusText,
      });
    };
  }

  function extractId(string) {
    let id: string;

    [/spotify:track:(.+)/, /.?open.spotify.com\/track\/(.+)\?.*/].find(
      (pattern) => string.match(pattern) && (id = string.match(pattern)[1]),
    );

    return id;
  }

  function extractPlaylistId(string) {
    let id;

    [/spotify:playlist:(.+)/, /.?open\.spotify\.com\/playlist\/([^?]+)/].find(
      (pattern) => string.match(pattern) && (id = string.match(pattern)[1]),
    );

    return id ? { id } : null;
  }

  function isHost(req) {
    return req.user.host && req.user.host.status === "success";
  }

  router.post("/queue-track", (req, res) => {
    console.log(
      `soMeBodyY (user "${req.user.username}" waTNTS to UQUE a song!!!`,
      req.body.trackId,
    );

    req.snoppifyHost.controller
      .queueTrack(req.user.username, req.body.trackId)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/dequeue-track", (req, res) => {
    req.snoppifyHost.controller
      .dequeueTrack(req.user.username, req.body.trackId)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/vote", (req, res) => {
    req.snoppifyHost.controller
      .vote(req.user.username, req.body.trackId)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/unvote", (req, res) => {
    req.snoppifyHost.controller
      .unvote(req.user.username, req.body.trackId)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/search", (req, res) => {
    const query = checkStr(req.query.query) || "";

    if (query == "") {
      res.send({
        tracks: {
          items: [],
        },
      });

      return;
    }

    const extractedId = extractId(query);

    const { snoppifyHost } = req;

    if (extractedId) {
      snoppifyHost.api
        .getTracks([extractedId])
        .then((data) => {
          let track = data.body.tracks[0];
          const queueTrack = snoppifyHost.controller.queue.get(track);

          if (track && queueTrack) {
            track = queueTrack;
          }

          res.send({
            tracks: {
              items: track ? [track] : [],
            },
          });
        })
        .catch(errorHandler(res));
    } else {
      snoppifyHost.api
        .searchTracks(query)
        .then((data) => {
          const result = { ...data.body };

          result.tracks.items = data.body.tracks.items.map(
            (track) => snoppifyHost.controller.queue.get(track) || track,
          );

          res.send(result);
        })
        .catch(errorHandler(res));
    }
  });

  router.get("/search-parties", (req, res) => {
    if (!isHost(req)) {
      res.status(401).end();
      return;
    }

    const data = {
      query: "",
      result: [],
    };

    if (!req.user.parties) {
      res.send(data);
      return;
    }

    const query = req.query.query
      ? (req.query.query as string).trim().toLowerCase()
      : "";
    const querySplit = query.split(/\s+/);

    data.result = req.user.parties;

    if (query != "") {
      data.result = req.user.parties.map((party) => {
        const name = party.name.toLowerCase();
        const p = {
          id: party.id,
          name: party.name,
          score: 0,
        };
        p.score = querySplit
          .map((val) => (name.search(val) != -1 ? 1 : 0))
          .reduce((a, b) => a + b, 0);
        return p;
      });
    }

    data.result = data.result.filter((party) =>
      typeof party.score === "undefined" ? true : party.score > 0,
    );

    data.result.sort((a, b) => a.score - b.score);

    res.send(data);
  });

  router.post("/set-party", (req, res) => {
    if (!isHost(req)) {
      res.status(401).end();
      return;
    }

    if (!req.user.parties) {
      res.status(404).end();
      return;
    }

    const party = req.user.parties.find((p) => p.id == req.body.id);
    if (!party) {
      res.status(404).end();
      return;
    }

    req.snoppifyHost.controller
      .setParty(party)
      .then((data) => {
        req.user.host.id = party.id;
        req.user.host.name = party.name;

        User.save(req.user, () => {
          res.send(data);
        });
      })
      .catch(errorHandler(res));
  });

  router.post("/set-party-name", (req, res) => {
    if (!isHost(req)) {
      res.status(401).end();
      return;
    }

    req.snoppifyHost.controller
      .updateMainPlaylist(req.body)
      .then((data) => {
        req.user.host.name = data.name;

        const party = req.user.parties.find((p) => p.id == req.user.host.id);
        if (party) {
          party.name = data.name;
        }

        User.save(req.user, () => {
          res.send(data);
        });
      })
      .catch(errorHandler(res));
  });

  router.post("/set-backup-playlist", (req, res) => {
    if (!isHost(req)) {
      res.status(401).end();
      return;
    }

    if (!req.body.uri) {
      // unset backup playlist
      req.snoppifyHost.controller.removeBackupPlaylist();

      res.status(200).end();
      return;
    }

    const playlist = extractPlaylistId(req.body.uri);

    if (!playlist) {
      res.status(400).end();
      return;
    }

    req.snoppifyHost.controller
      .setBackupPlaylist({ id: playlist.id })
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/set-active-device", (req, res) => {
    req.snoppifyHost.playbackAPI
      .setActiveDevice(req.body.id)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/get-devices", (req, res) => {
    const host = req.snoppifyHost;
    if (!host) {
      res.status(400).send();
      return;
    }
    host.playbackAPI
      .getDevices()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/get-track", (req, res) => {
    req.snoppifyHost.controller
      .getTrack(checkStr(req.query.trackId))
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/get-playlists", () => {});

  router.post("/play", (req, res) => {
    req.snoppifyHost.controller
      .play(req.body.playlist)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/pause", (req, res) => {
    req.snoppifyHost.controller
      .pause()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/play-next", (req, res) => {
    req.snoppifyHost.controller
      .playNext()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/empty-playlist", (req, res) => {
    req.snoppifyHost.controller
      .emptyPlaylist()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/empty-queue", (req, res) => {
    req.snoppifyHost.controller
      .emptyQueue()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/get-queue", (req, res) => {
    res.json({
      data: req.snoppifyHost.controller.getQueue(),
    });
  });

  router.get("/info", (req, res) => {
    const host = req.snoppifyHost;
    if (!host) {
      res.status(400).send();
      return;
    }
    res.json({
      party: host.controller.getCurrentParty(),
      queue: host.controller.getQueue(),
      currentTrack: host.controller.getCurrentTrack(),
      backupPlaylist: host.controller.getBackupPlaylist(),
    });
  });

  router.post("/play-sound", (req, res) => {
    if (!socket.io) {
      console.log("No socket");
      return;
    }
    socket.io.local.emit("event", {
      type: "playSound",
      data: {
        sound: req.body.sound,
      },
    });
    res.status(200).end();
  });

  router.get("/get-host-playlists", (req, res) => {
    req.snoppifyHost.api
      .getUserPlaylists("me", {
        limit: +req.query.limit || 15,
        offset: req.query.offset === undefined ? 0 : +req.query.offset,
      })
      .then((playlistRes) => {
        res.json(playlistRes.body.items);
      })
      .catch((err) => {
        res.json(err);
      })
      .finally(() => res.send());
  });

  router.post("/wifi", (req, res) => {
    if (!isHost(req)) {
      res.status(401);
      res.json({ error: "You need to be host!" });
      return;
    }

    const party = req.snoppifyHost.controller.getCurrentParty();
    if (!party) {
      res.status(500);
      res.json({ error: "No party file/object" });
      return;
    }

    party.wifi = req.body;
    res.send(
      `WIFI:S:${party.wifi.ssid};T:${party.wifi.encryption};P:${party.wifi.password};;`,
    );
  });

  router.get("/wifi", (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(403).end();
      return;
    }

    const wifi = req.snoppifyHost.controller.getCurrentParty()?.wifi;
    if (!wifi) {
      // return res.status(500).json({ error: "No wifi in the party object" });
      res.send(null);
      return;
    }

    res.send(`WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};;`);
  });

  return router;
}
