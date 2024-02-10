/* global SpotifyApi */

import { PartyFull } from "../models/Party/Party";
import { partyService } from "../models/Party/PartyService";
import { Queue } from "../models/Queue/Queue";
import { queueService } from "../models/Queue/QueueService";
import { QueueTrack, type QueueSpotifyTrack } from "../models/Queue/QueueTrack";
import User from "../models/User/User";
import { userService } from "../models/User/UserService";
import socket from "../socket";
import { logger } from "../utils/snoppify-logger";
import { SpotifyAPI } from "./spotify-api";
import SpotifyPlaybackAPI from "./spotify-playback-api";
import { createStateMachine, SnoppifyStateMachine } from "./spotify-states";

export class SpotifyController {
  private api: SpotifyAPI;

  private history = new Queue({});

  private backupQueue = new Queue<QueueTrack>({});

  private pollTimeout = 2000;

  private playerPollInterval: NodeJS.Timeout;

  private maxQueueSize = 5;

  private playlist: SpotifyApi.SinglePlaylistResponse;

  private playbackAPI: SpotifyPlaybackAPI;

  private states: SnoppifyStateMachine;

  private mainPlaylist: any;

  private backupPlaylist: any;

  private party: PartyFull;

  constructor(opts: { api: SpotifyAPI; playbackAPI: SpotifyPlaybackAPI }) {
    this.api = opts.api;
    this.playbackAPI = opts.playbackAPI;

    // TODO: do corresponding stuff as below but based on party id? Or
    // maybe not automatically at all?
    //
    // this.initQueueFile();
    // this.setupStateMachine();
    // this.init();
  }

  // eslint-disable-next-line class-methods-use-this
  async createNewParty(opts: { hostUser: User }): Promise<PartyFull> {
    const id = Date.now().toString();
    const name = `Snoppify ${id}`;

    const mainPlaylistId = (
      await this.api.createPlaylist(name, { public: true })
    ).body.id;

    const party: PartyFull = {
      id,
      name,
      mainPlaylistId,
      queue: new Queue<QueueTrack>({
        id: `q-${id}`,
      }),
      hostUser: opts.hostUser,
      active: true,
    };

    this.party = party;

    await Promise.all([this.saveParty(), this.init()]);

    return Promise.resolve(party);
  }

  async setParty(partyId: string) {
    const party = await partyService.getParty(partyId);

    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    logger.log(`Set party ${party.name} (${party.id})`);

    if (party.mainPlaylistId) {
      const mainPlaylistData = await this.api.getPlaylist(party.mainPlaylistId);
      this.mainPlaylist = mainPlaylistData.body;
    }
    if (party.backupPlaylistId) {
      const backupPlaylistData = await this.api.getPlaylist(
        party.backupPlaylistId,
      );
      this.backupPlaylist = backupPlaylistData.body;
    }

    this.party = party;
    this.init();

    return party;
  }

  getParty() {
    return this.party;
  }

  getInfo() {
    return {
      party: this.getParty(),
      queue: this.getQueue(),
      currentTrack: this.getCurrentTrack(),
      backupPlaylist: this.getBackupPlaylist(),
    };
  }

  async start() {
    this.beginPlayerPoll();
    await this.play(true);
    this.party.active = true;
    await this.saveParty();

    socket.io.local.emit("info", this.getInfo());
  }

  async stop() {
    this.stopPlayerPoll();
    this.party.active = false;
    await this.saveParty();

    socket.io.local.emit("info", this.getInfo());
  }

  private beginPlayerPoll() {
    if (this.playerPollInterval) {
      clearInterval(this.playerPollInterval);
    }
    this.playerPollInterval = setInterval(() => {
      this.pollPlayerStatus();
    }, this.pollTimeout);
  }

  private stopPlayerPoll() {
    if (this.playerPollInterval) {
      clearInterval(this.playerPollInterval);
    }
  }

  async queueTrack(userId: string, trackId: string): Promise<QueueTrack> {
    const r = await this.api.getTracks([trackId]);
    const track = r.body.tracks[0];

    // TODO: don't need this, just check master queue
    const userData = await userService.getUser(userId);

    if (!track) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 404,
          statusText: "Track not found",
        },
      });
    }

    if (this.party.queue.get(trackId)) {
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
        issuer: {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          displayName: userData.displayName,
          profile: userData.profile,
        },
        votes: [],
        timestamp: Date.now(),
      },
    };

    userData.queue.add(queueTrack);
    await userService.upsave(userData);

    // TODO: check if queue is empty and if track should be playing?
    this.party.queue.add(queueTrack);

    // userData.queue.add({
    //   id: queueTrack.id,
    // });

    await this.rebuildQueueOrder();

    // TODO: refactor put this state update to its own function
    this.states.data.events.queuedTrack = true;

    this.states.update();

    socket.io.local.emit("queue", {
      queue: this.party.queue.queue,
      addedTracks: [queueTrack],
      removedTracks: [],
    });

    logger.info("queue", this.party.queue);

    // this.saveQueue();
    await queueService.upsave(this.party.queue);

    // await userService.upsave(userData);

    return queueTrack;
  }

  async dequeueTrack(user: string, trackId: string): Promise<void> {
    // TODO: check if playing?
    const track = this.party.queue.get(trackId);

    if (!track || track.snoppify.issuer.username != user) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 404,
          statusText: "Track not found",
        },
      });
    }

    if (!this.party.queue.remove(track)) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        response: {
          status: 500,
          statusText: "Track could not be removed",
        },
      });
    }

    // userData.queue.remove(track);

    this.states.data.events.dequeuedTrack = true;

    this.states.update();

    socket.io.local.emit("queue", {
      queue: this.party.queue.queue,
      addedTracks: [],
      removedTracks: [track],
    });

    // this.saveQueue();
    queueService.upsave(this.party.queue);

    // await userService.upsave(userData);

    return Promise.resolve();
  }

  async vote(userId: string, trackId: any): Promise<void> {
    const track = this.party.queue.get(trackId);

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
      queue: this.party.queue.queue,
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
    const track = this.party.queue.get(trackId);

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
      queue: this.party.queue.queue,
      addedTracks: [],
      removedTracks: [],
    });
    this.sendEvent("unvote", {
      track,
      votes: track.snoppify.votes.length,
    });

    return Promise.resolve();
  }

  // TODO: Move to userService probably
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

  async updateMainPlaylist(opts: { name: string }): Promise<{ name?: string }> {
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

  async setBackupPlaylist({ id }: { id: string }) {
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
    let track: QueueTrack = this.party.queue.next();

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

    // this.saveQueue();
    await queueService.upsave(this.party.queue);

    if (track?.snoppify) {
      const userData = await userService.getUser(
        track.snoppify.issuer.username,
      );
      if (userData) {
        userData.queue.remove(track); // TODO: Do in userService or queueService instead
        userService.upsave(userData);
      }
    }

    this.sendEvent("waitingForNextSong", { track });

    if (track) {
      socket.io.local.emit("queue", {
        queue: this.party.queue.queue,
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

      if (!playData.playlist) {
        logger.error("Invalid playlist");
        throw new Error("Invalid playlist");
      }

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
          logger.error("Playlist not found");
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

    const removed = this.party.queue.queue;
    this.party.queue.clear();

    for (const user of allUsers) {
      User.clearUser(user);
    }

    await Promise.all(allUsers.map((user_2) => userService.upsave(user_2)));

    this.saveQueue();

    socket.io.local.emit("queue", {
      queue: this.party.queue.queue,
      addedTracks: [],
      removedTracks: removed,
    });
  }

  getQueue() {
    return this.party?.queue.queue;
  }

  getTrack(trackId: string) {
    return new Promise((resolve, reject) => {
      const track = this.party.queue.get(trackId);

      Promise.all([
        track
          ? Promise.resolve({
              body: { tracks: [track] as QueueSpotifyTrack[] },
            })
          : this.api.getTracks([trackId]),
        this.api.getAudioFeaturesForTracks([trackId]),
      ])
        .then((data) => {
          const trackObject: QueueSpotifyTrack & {
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

  getQueuedTrack(track: SpotifyApi.TrackObjectFull) {
    if (!this.party) {
      return null;
    }
    return this.party.queue.get(track);
  }

  private async reloadPlaylist() {
    return this.api
      .getPlaylist(this.party.mainPlaylistId)
      .then((data) => {
        this.playlist = data.body;

        this.states.data.playlist = this.playlist;

        this.states.update();
      })
      .catch((err) => {
        logger.error("Playlist not found");
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
            logger.error("addToPlaylist", r, JSON.stringify(r));
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
      logger.error("No socket");
      return;
    }
    socket.io.local.emit("event", {
      type,
      data: data || {},
    });
  }

  getCurrentTrack() {
    if (this.states?.data?.player?.item) {
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
    let tracksCount = this.party.queue.size;

    // TODO: replace with generating queue per user from main party queue
    const allUsers = await userService.getAll();

    for (let i = 0; i < this.party.queue.size; i++) {
      const sublist = [];
      for (const user of allUsers) {
        const t = user.queue.getAt(i);
        if (t) {
          const track = this.party.queue.get(t);

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

    const newQueue = new Queue<QueueTrack>({
      id: this.party.queue.id,
    });
    list.forEach((track) => newQueue.add(track));

    this.party.queue = newQueue;
  }

  private async saveParty() {
    return partyService.upsave(this.party);
  }

  private async saveQueue() {
    if (this.party) {
      await queueService.upsave(this.party.queue);
    }
  }

  /// /////

  private async init(): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.party.backupPlaylistId) {
      promises.push(
        this.setBackupPlaylist({ id: this.party.backupPlaylistId }),
      );
    }

    await Promise.all(promises);

    this.setupStateMachine();

    await this.reloadPlaylist();

    this.start();
  }

  private setupStateMachine() {
    this.states = createStateMachine();

    this.states.after(() => {
      // clear events
      for (const ev of Object.keys(this.states.data.events)) {
        this.states.data.events[ev] = false;
      }
    });

    this.states.on("paused", (s) => {
      logger.info(s.name);
      this.sendEvent(s.name, {
        track: this.getCurrentTrack(),
      });
    });

    this.states.on("playing", (s) => {
      logger.info(s.name);
      this.sendEvent(s.name, {
        track: this.getCurrentTrack(),
      });
    });

    this.states.on("playSong", (s) => {
      logger.info(s.name);

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
      logger.info(s.name);
      this.playNextTrack();
    });

    this.states.start();
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
