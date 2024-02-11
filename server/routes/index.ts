import express, { Response } from "express";
import { PassportStatic } from "passport";
import { userService } from "../models/User/UserService";
import { partyService } from "../models/Party/PartyService";
import socket from "../socket";
import { logger } from "../utils/snoppify-logger";
// import { spotifyAPIScopes } from "../spotify/spotify-playback-api";
import routesAuthIndex from "./auth";
import { userGuestAuth, userHostAuth } from "../utils/middlewares/user";
import { createParty, removeSnoppifyHostParty, removeSnoppifyHostUser } from "../spotify";

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line global-require
  require("dotenv").config();
}

/* const spotifyAPI = */
// createSpotifyAPI().init();

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

  function errorHandler(res: Response) {
    return (r) => {
      logger.error("routes/index errorHandler:", res, r);

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

  /* Guest user */

  router.post("/queue-track", userGuestAuth, (req, res) => {
    logger.info(
      `soMeBodyY (user "${req.user.username}" waTNTS to UQUE a song!!!`,
      req.body.trackId,
    );

    req.snoppifyHost.controller
      .queueTrack(req.user.id, req.body.trackId)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/dequeue-track", userGuestAuth, (req, res) => {
    req.snoppifyHost.controller
      .dequeueTrack(req.user.id, req.body.trackId)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/vote", userGuestAuth, (req, res) => {
    req.snoppifyHost.controller
      .vote(req.user.id, req.body.trackId)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/unvote", userGuestAuth, (req, res) => {
    req.snoppifyHost.controller
      .unvote(req.user.id, req.body.trackId)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/search", userGuestAuth, (req, res) => {
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
          const trackFull = data.body.tracks[0];
          const queueTrack = snoppifyHost.controller.getQueuedTrack(trackFull);

          res.send({
            tracks: {
              items: queueTrack ? [queueTrack] : [],
            },
          });
        })
        .catch(errorHandler(res));
    } else {
      snoppifyHost.api
        .searchTracks(query)
        .then((data) => {
          const result = { ...data.body };

          res.send({
            ...result,
            tracks: {
              ...result.tracks,
              items: data.body.tracks.items.map(
                (track) =>
                  snoppifyHost.controller.getQueuedTrack(track) || track,
              ),
            },
          });
        })
        .catch(errorHandler(res));
    }
  });

  router.get("/info", userGuestAuth, (req, res) => {
    const host = req.snoppifyHost;
    if (!host) {
      res.status(400).send();
      return;
    }
    res.json(host.controller.getInfo());
  });

  router.post("/play-sound", userGuestAuth, (req, res) => {
    if (!socket.io) {
      logger.error("No socket");
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

  /* Host user */

  router.get("/search-parties", userHostAuth, (req, res) => {
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

  router.post("/create-party", userHostAuth, async (req, res) => {
    const party = await createParty(req.user, req.snoppifyHost);

    req.snoppifyHost.controller
      .setParty(party.id)
      .then((data) => {
        req.user.host.id = party.id;
        req.user.host.name = party.name;

        userService.upsave(req.user).then(() => res.send(data));
      })
      .catch(errorHandler(res));
  });

  router.post("/set-party", userHostAuth, (req, res) => {
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
      .setParty(party.id)
      .then((data) => {
        req.user.host.id = party.id;
        req.user.host.name = party.name;

        userService.upsave(req.user).then(() => res.send(data));
      })
      .catch(errorHandler(res));
  });

  router.post("/delete-party", userHostAuth, async (req, res) => {
    const party = req.user.parties.find((p) => p.id === req.body.id);
    if (!party) {
      res.status(404).end();
      return;
    }

    const partyObj = await partyService.getParty(party.id);

    req.snoppifyHost.controller
      .delete(party.id)
      .then((data) => {
        // NOTE: the party is removed from the DB here
        removeSnoppifyHostUser(req.user);
        removeSnoppifyHostParty(partyObj);

        // TODO: also delete snoppifyHost?
        req.user.host = null;
        req.user.queue = null;
        req.user.votes = null;
        req.user.friends = [];
        req.user.parties =
          req.user.parties?.filter((p) => p.id !== party.id) ?? [];
        req.user.partyId = null;

        userService.upsave(req.user).then(() => res.send(data));
      })
      .catch(errorHandler(res));
  });

  router.post("/set-party-name", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .updateMainPlaylist(req.body)
      .then((data) => {
        req.user.host.name = data.name;

        const party = req.user.parties.find((p) => p.id == req.user.host.id);
        if (party) {
          party.name = data.name;
        }

        userService.upsave(req.user).then(() => res.send(data));
      })
      .catch(errorHandler(res));
  });

  router.post("/set-backup-playlist", userHostAuth, (req, res) => {
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
      .then(() => {
        partyService
          .getParty(req.user.host.id)
          .then((party) => {
            if (!party) {
              res.status(401).json({ error: "No active party" });
              return;
            }

            partyService
              .upsave({
                ...party,
                backupPlaylistId: playlist.id,
              })
              .then(successHandler(res))
              .catch(errorHandler(res));
          })
          .catch(errorHandler(res));
      })
      .catch(errorHandler(res));
  });

  router.post("/set-active-device", userHostAuth, (req, res) => {
    req.snoppifyHost.playbackAPI
      .setActiveDevice(req.body.id)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/get-devices", userHostAuth, (req, res) => {
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

  router.get("/get-track", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .getTrack(checkStr(req.query.trackId))
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/get-playlists", userHostAuth, () => {});

  router.post("/start-party", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .start()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/stop-party", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .stop()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/play", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .play(req.body.playlist)
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/pause", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .pause()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/play-next", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .playNext()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/empty-playlist", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .emptyPlaylist()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.post("/empty-queue", userHostAuth, (req, res) => {
    req.snoppifyHost.controller
      .emptyQueue()
      .then(successHandler(res))
      .catch(errorHandler(res));
  });

  router.get("/get-queue", userHostAuth, (req, res) => {
    res.json({
      data: req.snoppifyHost.controller.getQueue(),
    });
  });

  router.get("/get-host-playlists", userHostAuth, (req, res) => {
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

  router.post("/wifi", userHostAuth, (req, res) => {
    const party = req.snoppifyHost.controller.getParty();
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

  router.get("/wifi", userHostAuth, (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(403).end();
      return;
    }

    const wifi = req.snoppifyHost.controller.getParty()?.wifi;
    if (!wifi) {
      // return res.status(500).json({ error: "No wifi in the party object" });
      res.send(null);
      return;
    }

    res.send(`WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};;`);
  });

  return router;
}
