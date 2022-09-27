/* global SpotifyApi */

import * as fs from "fs";
import mkdirp from "mkdirp";
import { Queue } from "../models/Queue/Queue";
import { QueueTrack } from "../models/Queue/QueueTrack";
import User from "../models/User/User";
import { userService } from "../models/User/UserService";
import socket from "../socket";
import { SpotifyAPI } from "./spotify-api";
import { SpotifyPlaybackAPI } from "./spotify-playback-api";
import { createStateMachine, SnoppifyStateMachine } from "./spotify-states";

export { SpotifyController };

class SpotifyController {
  private api: SpotifyAPI;

  queue = new Queue({});

  private history = new Queue({});

  private backupQueue = new Queue({});

  private pollTimeout = 2000;

  private maxQueueSize = 5;

  private playlist: any = null;

  private queueFile = "";

  private partyFile = null;

  private currentParty = null;

  private playbackAPI: SpotifyPlaybackAPI;

  private states: SnoppifyStateMachine;

  constructor(opts: { api: SpotifyAPI; playbackAPI: SpotifyPlaybackAPI }) {
    this.api = opts.api;
    this.playbackAPI = opts.playbackAPI;

    this.initQueueFile();
    this.init();
  }

  setParty(
    party: any,
    opts?: any,
  ): Promise<{
    id: string;
    queue: string[];
    mainPlaylist: SpotifyController["mainPlaylist"];
    backupPlaylist: SpotifyController["backupPlaylist"];
  }> {
    console.log("Party is this:");
    console.log(JSON.stringify(party, null, 2));

    // check if ok to set here!
    this.currentParty = party;

    return new Promise((resolve, reject) => {
      // var filename = "data/snoppify-party-" + party.id + ".json";
      const filename = this.queueFile;

      // load saved party
      fs.readFile(filename, "utf8", (err, data) => {
        // file does not exist
        if (err) {
          if (!opts || !opts.mainPlaylist) {
            reject(new Error("A main playlist is required"));
            return;
          }

          console.log(`saving new party ${party.name} (${party.id})`);

          this.currentParty = party;
          this.partyFile = filename;
          this.mainPlaylist = opts.mainPlaylist;
          this.backupPlaylist = opts.backupPlaylist || null;

          this.saveQueue();

          resolve({
            id: party.id,
            queue: [],
            mainPlaylist: this.mainPlaylist,
            backupPlaylist: this.backupPlaylist,
          });
          return;
        }
        // file exist
        try {
          console.log(`set party ${party.name} (${party.id})`);

          this.currentParty = party;
          this.partyFile = filename;

          const obj = JSON.parse(data);

          this.queue.clear();
          obj.queue.forEach((track: any) => {
            this.queue.add(track);
          });

          // if (obj.currentTrack) {
          //     history.add(obj.currentTrack);
          // }

          if (obj.mainPlaylist) {
            this.mainPlaylist = obj.mainPlaylist;
          }

          if (obj.backupPlaylist) {
            this.backupPlaylist = obj.backupPlaylist;
          }

          this.saveQueue();

          resolve(obj);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  getCurrentParty() {
    return this.currentParty;
  }

  async queueTrack(user: string, trackId: string): Promise<QueueTrack> {
    const r = await this.api.getTracks([trackId]);
    const track = r.body.tracks[0];

    const userData = await userService.getUser(user);

    if (!track) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 404,
          statusText: "Track not found",
        },
      });
    }

    if (this.queue.get(trackId)) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 400,
          statusText: "Track already added",
        },
      });
    }

    if (userData.queue.get(trackId)) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 400,
          statusText: "You have already added this track",
        },
      });
    }

    if (userData.queue.size == this.maxQueueSize) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 400,
          statusText: `You cannot add more than ${this.maxQueueSize} tracks`,
        },
      });
    }

    const queueTrack: QueueTrack = {
      ...track,
      snoppify: {
        issuer: userData,
        votes: [],
        timestamp: Date.now(),
      },
    };

    // TODO: check if queue is empty and if track should be playing?
    this.queue.add(queueTrack);
    userData.queue.add({
      id: queueTrack.id,
    });

    await this.rebuildQueueOrder();

    this.states.data.events.queuedTrack = true;

    this.states.update();

    socket.io.local.emit("queue", {
      queue: this.queue.queue,
      addedTracks: [queueTrack],
      removedTracks: [],
    });

    this.saveQueue();
    await userService.upsave(userData);

    return queueTrack;
  }

  async dequeueTrack(user: string, trackId: string): Promise<void> {
    // TODO: check if playing?
    const track = this.queue.get(trackId);
    const userData = await userService.getUser(user);

    if (!track || track.snoppify.issuer.username != user) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 404,
          statusText: "Track not found",
        },
      });
    }

    if (!this.queue.remove(track)) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 500,
          statusText: "Track could not be removed",
        },
      });
    }

    userData.queue.remove(track);

    this.states.data.events.dequeuedTrack = true;

    this.states.update();

    socket.io.local.emit("queue", {
      queue: this.queue.queue,
      addedTracks: [],
      removedTracks: [track],
    });

    this.saveQueue();

    await userService.upsave(userData);

    return Promise.resolve();
  }

  async vote(userId: string, trackId: any): Promise<void> {
    const track = this.queue.get(trackId);

    if (!track) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 404,
          statusText: "No such track",
        },
      });
    }

    if (track.snoppify.votes.indexOf(userId) !== -1) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 400,
          statusText: "You have already voted",
        },
      });
    }

    track.snoppify.votes.push(userId);

    // update friendships
    this.updateFriendship(track, userId, 1);

    await this.rebuildQueueOrder();

    this.saveQueue();

    this.states.data.events.userVoted = true;

    this.states.update();

    socket.io.local.emit("queue", {
      queue: this.queue.queue,
      addedTracks: [],
      removedTracks: [],
    });
    this.sendEvent("vote", {
      track,
      votes: track.snoppify.votes.length,
    });

    return Promise.resolve();
  }

  async unvote(user: string, trackId: any): Promise<void> {
    const track = this.queue.get(trackId);

    if (!track) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 404,
          statusText: "No such track",
        },
      });
    }

    const i = track.snoppify.votes.indexOf(user);
    if (i != -1) {
      track.snoppify.votes.splice(i, 1);
    }

    // update friendships
    this.updateFriendship(track, user, -1);

    await this.rebuildQueueOrder();

    this.saveQueue();

    this.states.data.events.userVoted = true;

    this.states.update();

    socket.io.local.emit("queue", {
      queue: this.queue.queue,
      addedTracks: [],
      removedTracks: [],
    });
    this.sendEvent("unvote", {
      track,
      votes: track.snoppify.votes.length,
    });

    return Promise.resolve();
  }

  private updateFriendship(track, voterId, vote) {
    const issuerId = track.snoppify.issuer.id;

    // get voter
    userService.getUser(voterId).then((foundVoterUser) => {
      const uVoter = { ...foundVoterUser };

      if (!uVoter.votes.given[issuerId]) {
        uVoter.votes.given[issuerId] = 0;
      }
      uVoter.votes.given[issuerId] += vote;
      uVoter.votes.givenTotal += vote;

      // get issuer
      userService.getUser(issuerId).then((foundIssuerUser) => {
        const uIssuer = { ...foundIssuerUser };

        if (!uIssuer.votes.received[voterId]) {
          uIssuer.votes.received[voterId] = 0;
        }
        uIssuer.votes.received[voterId] += vote;
        uIssuer.votes.receivedTotal += vote;

        this.sendEvent("friend.vote", {
          user: uIssuer,
          voter: uVoter,
          votes: uIssuer.votes.received[voterId],
          vote,
        });

        const areFriends = !!uIssuer.friends.find(
          (u) => u.username == uVoter.username,
        );

        if (uIssuer.votes.received[voterId] >= 3 && !areFriends) {
          // new friends!
          uIssuer.friends.push({
            username: uVoter.username,
            displayName: uVoter.displayName,
          });
          uVoter.friends.push({
            username: uIssuer.username,
            displayName: uIssuer.displayName,
          });

          this.sendEvent("friend.new", {
            user: uIssuer,
            voter: uVoter,
            votes: uIssuer.votes.received[voterId],
          });
        }

        userService.upsave(uVoter);
        userService.upsave(uIssuer);
      });
    });
  }

  getBackupPlaylist() {
    // console.log(backupPlaylist);
    return this.backupPlaylist;
  }

  createMainPlaylist(name: string) {
    return this.api
      .createPlaylist(name, {
        public: true,
      })
      .then((data) => {
        const { tracks, ...body } = data.body;
        this.mainPlaylist = body;

        this.saveQueue();

        this.sendEvent("mainPlaylist", {
          playlist: this.mainPlaylist,
        });

        return data.body;
      });
  }

  private setMainPlaylist({ id }: { id: string }) {
    return this.api
      .getPlaylist(id)
      .then((data) => {
        const { tracks, ...body } = data.body;
        this.mainPlaylist = body;

        this.saveQueue();

        this.sendEvent("mainPlaylist", {
          playlist: this.mainPlaylist,
        });
      })
      .catch((r) => {
        console.log(r);
        throw r;
      });
  }

  updateMainPlaylist(opts: { name: string }): Promise<{ name?: string }> {
    if (!this.mainPlaylist) {
      return Promise.reject(new Error("ERR: No main playlist"));
    }

    const params = {
      name: opts.name || this.mainPlaylist.name,
    };

    return this.api
      .changePlaylistDetails(this.mainPlaylist.id, params)
      .then(() => params);
  }

  setBackupPlaylist({ id }: { id: string }) {
    return this.api.getPlaylist(id).then((data) => {
      this.backupQueue = new Queue({
        id: "id",
        queue: data.body.tracks.items.map((_track: any) => {
          const track = _track;
          track.track.snoppify = {
            issuer: {
              id: "1337",
              username: "1337",
              displayName: "Snoppify Bot",
              profile:
                "https://f29682d3f174928942ed-2ffcea2cbcb9e3aa51fd8a91e66dd2e9.ssl.cf2.rackcdn.com/1410771548.09_avatar.png",
            },
            votes: [],
          };
          return track.track;
        }),
      });

      const { tracks, ...body } = data.body;

      this.backupPlaylist = body;

      this.saveQueue();

      this.sendEvent("backupPlaylist", {
        playlist: this.backupPlaylist,
      });
    });
  }

  removeBackupPlaylist() {
    this.backupPlaylist = null;
    this.saveQueue();
    this.sendEvent("backupPlaylist", {
      playlist: this.backupPlaylist,
    });
  }

  playNext() {
    return this.playNextTrack().then(() => this.next());
  }

  private async playNextTrack(): Promise<void> {
    let track = this.queue.next();

    if (!track) {
      if (this.backupPlaylist) {
        track = this.backupQueue.nextRandomCursor();
      } else {
        track = this.getCurrentTrack();
      }
    }

    await this.addToPlaylist(track);

    if (track) {
      // save issuer for later
      this.history.add(track);
    }

    this.saveQueue();

    if (track?.snoppify) {
      const userData = await userService.getUser(
        track.snoppify.issuer.username,
      );
      if (userData) {
        userData.queue.remove(track.id); // TODO: Do in fucntion instead
        userService.upsave(userData);
      }
    }

    this.sendEvent("waitingForNextSong", { track });

    if (track) {
      socket.io.local.emit("queue", {
        queue: this.queue.queue,
        addedTracks: [],
        removedTracks: [track],
      });
    }

    if (
      this.states.data.playlist &&
      this.states.data.playlist.tracks.items.length == 0
    ) {
      // BUG: cant start a playlist that havent been intereacted with from a spotify client,
      // for example after emptying the playlist
      // play(true);
    }
  }

  play(playPlaylist = false) {
    const playData = {} as any;
    if (playPlaylist) {
      playData.playlist = this.mainPlaylist?.id || this.api.config.playlist;

      return this.api
        .getPlaylist(playData.playlist)
        .then((data) => {
          this.playlist = data.body;

          this.states.data.playlist = this.playlist;

          this.states.update();

          if (this.playlist.tracks.total > 0) {
            playData.position = this.playlist.tracks.total - 1;
            return this.playbackAPI.play(playData);
          } else {
            return this.playNext().then(() => this.play(playPlaylist));
          }
        })
        .catch((err) => {
          console.log("Playlist not found");
          throw err;
        });
    } else {
      return this.playbackAPI.play();
    }
  }

  pause() {
    return this.playbackAPI.pause();
  }

  next() {
    return this.playbackAPI.next();
  }

  previous() {
    return this.playbackAPI.previous();
  }

  emptyPlaylist() {
    // TODO: Move to PartyService
    const promises = [];
    if (this.playlist) {
      for (let i = 0; i < this.playlist.tracks.items.length; i += 100) {
        const positions = (this.playlist.tracks.items as any[])
          .slice(i, i + 100)
          .map((_, _i) => i + _i);
        const p = this.playbackAPI.removePositionsFromPlaylist(
          this.api.config.owner,
          this.playlist.id,
          positions,
          this.playlist.snapshot_id,
        );
        promises.push(p);
      }
    }
    return Promise.all(promises).then(() => {
      this.reloadPlaylist();
    });
  }

  async emptyQueue(): Promise<void> {
    // TODO: Move to userService or queueService, make party-specific
    const allUsers = await userService.getAll();

    const removed = this.queue.queue;
    this.queue.clear();

    for (const user of allUsers) {
      User.clearUser(user);
    }

    await Promise.all(allUsers.map((user_2) => userService.upsave(user_2)));

    this.saveQueue();

    socket.io.local.emit("queue", {
      queue: this.queue.queue,
      addedTracks: [],
      removedTracks: removed,
    });
  }

  getQueue() {
    return this.queue.queue;
  }

  getTrack(trackId: string) {
    return new Promise((resolve, reject) => {
      const track = this.queue.get(trackId);

      Promise.all([
        track
          ? Promise.resolve({
              body: { tracks: [track] as SpotifyApi.TrackObjectFull[] },
            })
          : this.api.getTracks([trackId]),
        this.api.getAudioFeaturesForTracks([trackId]),
      ])
        .then((data) => {
          const trackObject: SpotifyApi.TrackObjectFull & {
            audio_features?: SpotifyApi.AudioFeaturesObject;
          } = data[0].body.tracks[0];

          // console.log(JSON.stringify(track, null, 2));
          trackObject.audio_features = data[1].body.audio_features[0];

          resolve(trackObject);
        })
        .catch((data) => {
          reject(data);
        });
    });
  }

  private reloadPlaylist() {
    return this.api
      .getPlaylist(this.mainPlaylist?.id || this.api.config.playlist)
      .then((data) => {
        this.playlist = data.body;

        this.states.data.playlist = this.playlist;

        this.states.update();
      })
      .catch((err) => {
        console.log("Playlist not found");
        throw err;
      });
  }

  private addToPlaylist(track: string | { uri: string }) {
    this.playlist = this.mainPlaylist;

    return new Promise<void>((resolve, reject) => {
      if (this.playlist && track) {
        const uri =
          typeof track === "string" ? `spotify:track:${track}` : track.uri;

        this.playbackAPI
          .addToPlaylist(this.api.config.owner, this.playlist.id, [uri])
          .then(() => {
            this.reloadPlaylist();
            resolve();
          })
          .catch((r) => {
            console.log("ERROR:", r, JSON.stringify(r));
            reject(r);
          });
      } else {
        reject();
      }
    });
  }

  private pollPlayerStatus() {
    return this.playbackAPI
      .currentlyPlaying()
      .then((player) => {
        this.states.data.isPlaying = player.is_playing;

        // got new player
        if (!this.states.data.player) {
          if (player.is_playing) {
            this.states.data.events.startedPlaying = true;
          }
          if (!player.is_playing) {
            this.states.data.events.stoppedPlaying = true;
          }
          // possible bug fixed: should be this.states.data.events.changedTrack?
          this.states.data.events.changedTrack = true;
        } else {
          // started/stopped playing
          if (this.states.data.player.is_playing != player.is_playing) {
            if (player.is_playing) {
              this.states.data.events.startedPlaying = true;
            }
            if (!player.is_playing) {
              this.states.data.events.stoppedPlaying = true;
            }
          }
          // changed track
          if (
            player.item &&
            (!this.states.data.player.item ||
              this.states.data.player.item.id != player.item.id)
          ) {
            this.states.data.events.changedTrack = true;
          }
        }

        this.states.data.player = player;

        if (player) {
          const status = {
            progress: getTimeString(player.progress_ms),
            duration: "",
            fraction: 0,
          };
          if (player.item) {
            status.duration = getTimeString(player.item.duration_ms);
            status.fraction = player.progress_ms / player.item.duration_ms;
          }
          this.sendEvent("player", {
            isPlaying: player.is_playing,
            track: player.item,
            status,
          });
        }

        this.states.update();
      })
      .catch(() => {
        //
      });
  }

  // eslint-disable-next-line class-methods-use-this
  private sendEvent(type: string, data: any) {
    if (!socket.io) {
      console.log("No socket");
      return;
    }
    socket.io.local.emit("event", {
      type,
      data: data || {},
    });
  }

  getCurrentTrack() {
    if (this.states.data.player && this.states.data.player.item) {
      return (
        this.history.get(this.states.data.player.item) ||
        this.states.data.player.item
      );
    }
    return null;
  }

  private async rebuildQueueOrder() {
    let list: any[] = [];
    let maxVotes = -1;

    // fetch all tracks with votes with inital order by addition
    let tracksCount = this.queue.size;
    const allUsers = await userService.getAll();

    for (let i = 0; i < this.queue.size; i++) {
      const sublist = [];
      for (const user of allUsers) {
        const t = user.queue.getAt(i);
        if (t) {
          const track = this.queue.get(t);

          if (track) {
            sublist.push(track);

            maxVotes = Math.max(
              maxVotes,
              track.snoppify ? track.snoppify.votes.length : 0,
            );

            tracksCount--;
          }
        }
      }
      sublist.sort(orderByTimestamp);
      list = list.concat(sublist);

      if (tracksCount <= 0) {
        break;
      }
    }

    // sort list by votes
    let index = 0;
    // iterate all votes
    for (let curVotes = maxVotes; curVotes >= 0; curVotes--) {
      // find next vote (from lowest safe index)
      for (let i = index; i < list.length; i++) {
        if (list[i].snoppify && list[i].snoppify.votes.length == curVotes) {
          // insert i at position index (shifting the array)
          const tmp = list.splice(i, 1);
          list.splice(index, 0, tmp[0]);
          index++;
        }
      }
    }

    this.queue.queue = list;
  }

  private saveQueue() {
    const json = JSON.stringify({
      currentTrack: this.getCurrentTrack(),
      queue: this.queue.queue,
      mainPlaylist: this.mainPlaylist,
      backupPlaylist: this.backupPlaylist,
    });
    fs.writeFile(this.queueFile, json, "utf8", (err) => {
      if (err) {
        console.log(err);
      }
    });

    if (this.partyFile) {
      fs.writeFile(this.partyFile, json, "utf8", (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  }

  /// /////

  private init() {
    if (this.mainPlaylist) {
      this.setMainPlaylist({ id: this.mainPlaylist.id });
    }

    if (this.backupPlaylist) {
      this.setBackupPlaylist({ id: this.backupPlaylist.id });
    }

    if (this.mainPlaylist) {
      this.reloadPlaylist();
    }

    if (this.api.getCredentials().refreshToken) {
      setInterval(() => {
        this.pollPlayerStatus();
      }, this.pollTimeout);
    }

    this.states = createStateMachine();

    this.states.after(() => {
      // clear events
      for (const ev of Object.keys(this.states.data.events)) {
        this.states.data.events[ev] = false;
      }
    });

    this.states.on("paused", (s) => {
      console.log(s.name);
      this.sendEvent(s.name, {
        track: this.getCurrentTrack(),
      });
    });

    this.states.on("playing", (s) => {
      console.log(s.name);
      this.sendEvent(s.name, {
        track: this.getCurrentTrack(),
      });
    });

    this.states.on("playSong", (s) => {
      console.log(s.name);

      const track = this.getCurrentTrack();

      if (track && track.snoppify) {
        const sock = socket.sockets[track.snoppify.issuer.username];
        if (sock) {
          sock.emit("event", {
            type: "playMySong",
            data: {
              track,
            },
          });
        }
      }

      this.sendEvent(s.name, {
        track,
      });

      this.saveQueue();
    });

    this.states.on("waitingForNextSong", (s) => {
      console.log(s.name);
      this.playNextTrack();
    });

    this.states.start();
  }

  private initQueueFile() {
    mkdirp.sync("data");
    this.queueFile = "data/snoppify-queue.json";

    // load saved queue
    fs.readFile(this.queueFile, "utf8", (err, data) => {
      if (err) {
        console.log("user init");
        this.saveQueue();
        return;
      }
      try {
        const obj = JSON.parse(data);

        obj.queue.forEach((track: any) => {
          this.queue.add(track);
        });

        if (obj.currentTrack) {
          this.history.add(obj.currentTrack);
        }

        if (obj.mainPlaylist) {
          this.mainPlaylist = obj.mainPlaylist;
        }

        if (obj.backupPlaylist) {
          this.backupPlaylist = obj.backupPlaylist;
        }

        this.saveQueue();
      } catch (e) {
        console.log(e);
      }
    });
  }
}

// Util functions

function toNumberString(n: number) {
  let s = `${n}`;
  if (s.length == 1) {
    s = `0${s}`;
  }
  return s;
}

function getTimeString(ms: number) {
  let s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  s -= m * 60;
  return `${toNumberString(m)}:${toNumberString(s)}`;
}

/**
 * Earliest timestamp first
 */
function orderByTimestamp(a: any, b: any) {
  if (!a.snoppify || !b.snoppify) {
    return a.snoppify ? -1 : 1;
  }
  return a.snoppify.timestamp - b.snoppify.timestamp;
}
