<template>
  <div class="host-container">
    <div class="container">
      <h1>Host a Snoppify party!</h1>

      <p v-if="error">
        <b>{{ error }}</b>
      </p>

      <div v-if="!user.host">
        <form v-bind:action="baseURL + authUrls.spotify" class="auth auth--spotify">
          <input type="submit" value="Host a party" />
        </form>

        <p class="login">
          or
          <a v-bind:href="baseURL + authUrls.spotifyLogin">log in</a>
        </p>
      </div>

      <div v-if="user.host && user.host.status == 'success'">
        <p>
          Logged in as
          <b>{{ user.displayName }}</b>
        </p>

        <div v-if="!user.host.id">
          <form v-bind:action="baseURL + authUrls.spotify" class="auth auth--spotify">
            <input type="submit" value="Host a party" />
          </form>
        </div>
      </div>

      <div v-if="user.host && user.host.status == 'pending'">
        <p>Authenticating...</p>
      </div>

      <div v-if="user.host && user.host.id">
        <p>ID: {{user.host.id}}</p>
        <p>
          Name: {{user.host.name}}
          <input
            type="button"
            v-on:click="changePartyName()"
            value="change"
          />
        </p>
        <p>IP: {{user.host.ip}}</p>
        <p>SnoppiCode: {{user.host.hostCode}}</p>
        <p>Hoster: {{user.username}}</p>

        <hr />

        <p>Devices:</p>
        <ul v-if="devices">
          <li v-for="d in devices" :key="d.id">
            <label>
              <input
                type="radio"
                v-bind:value="d.id"
                v-model="device"
                v-on:click="setActiveDevice(d.id)"
              />
              {{d.name}} ({{d.type}})
            </label>
          </li>
        </ul>

        <form v-on:submit.prevent="setBackupPlaylist(backupUrl)">
          <input v-model="backupUrl" placeholder="Paste a playlist uri" />
          <button type="submit">Set</button>
        </form>
        <p>
          Backup playlist:
          <span v-if="backupPlaylist">
            <b>{{ backupPlaylist.name }}</b>
            ({{
            backupPlaylist.owner.display_name
            }})
          </span>
          <span v-else>(not set)</span>
        </p>

        <button
          v-on:click="playPlaylist"
          :disabled="!device || queue.length == 0 && !backupPlaylist"
          class="start-playback-btn"
        >Start playback</button>

        <p>Playback can be started if you have an active device and a backup playlist or at least one song in the queue.</p>

        <hr />

        <h1 v-if="player.isPlaying">Now playing</h1>
        <h1 v-else>Paused</h1>

        <div class="current-track current-track_compact" v-if="currentTrack">
          <img v-if="currentTrack.album" :src="currentTrack.album.images[1].url" alt />
          <div class="current-track__track-info">
            <div class="title">{{ currentTrack.name }}</div>
            <div class="artist">
              <span v-for="(artist, index) in currentTrack.artists" :key="index">
                <span>{{ artist.name }}</span>
                <span v-if="index + 1 < currentTrack.artists.length">,</span>
              </span>
            </div>
          </div>
          <div class="current-track__user-info" v-if="currentTrack.snoppify">
            <div
              class="user-image"
              :style="{
              'background-image':
                'url(' + currentTrack.snoppify.issuer.profile + ')',
            }"
            ></div>
            <div class="user">
              <div class="title">Added by</div>
              <div class="name">{{ currentTrack.snoppify.issuer.displayName }}</div>
              <div class="upvotes">{{ currentTrack.snoppify.votes.length }} upvotes</div>
            </div>
          </div>
        </div>

        <p v-if="queue">{{queue.length}} tracks in queue.</p>

        <p>Basic playback control.</p>
        <button v-on:click="play">Play</button>
        <button v-on:click="pause">Pause</button>

        <p>Play next song in the party queue.</p>
        <button v-on:click="playNext">Next track</button>

        <p>Empty spotify playlist.</p>
        <button v-on:click="emptyPlaylist">Empty playlist</button>

        <p>Empty party queue.</p>
        <button v-on:click="emptyQueue">Empty queue</button>

        <div v-if="user.host">
          <hr />

          <h1>Wifi sharing</h1>
          <p>Note: this will generate a QR code but it will not be encrypted or anything. Anyone could "steeeaaal" this 🙄</p>
          <div style="padding:20px; border:1px solid #666; border-radius:5px;">
            <p>UPDATE:</p>
            <form action @submit="setWifiCredentials">
              <label>
                Name/SSID:
                <input type="text" v-model="wifiCredentials.ssid" />
              </label>
              <label>
                Password:
                <input type="text" v-model="wifiCredentials.password" />
              </label>
              <label>
                Encryption type:
                <select v-model="wifiCredentials.encryption">
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value>None</option>
                </select>
              </label>

              <p>
                <button type="submit">save</button>
              </p>
            </form>
          </div>

          <p>CURRENT VALUE:</p>
          <div v-if="wifiQR">
            <canvas ref="wifiCanvas"></canvas>
            <p>{{wifiQR}}</p>
          </div>
        </div>

        <hr />

        <p>Your saved parties</p>

        <form v-on:submit.prevent class="search-input">
          <input
            v-on:input="searchParties"
            v-on:focus="searchParties"
            ref="input"
            placeholder="Search parties"
            v-model="partySearchTerm"
          />
        </form>

        <div class="search-results">
          <div v-if="partyResult && partyResult.length == 0" class="search-results__info">
            <p>Nothing here :(</p>
          </div>
          <ul v-if="partyResult && partyResult.length > 0" class="search-list">
            <li v-for="party in partyResult" :key="party.id">
              {{party.name}} ({{party.id}})
              <input
                type="button"
                value="Set"
                v-on:click="setParty(party.id)"
              />
            </li>
          </ul>
        </div>

        <hr />
      </div>

      <div v-if="user.host">
        <form action="/logout">
          <input type="submit" value="Logout" class="snopp-btn" />
        </form>
      </div>

      <!-- <form v-on:submit.prevent="" class="search-input">
      <input
        v-on:input="searchPlaylists"
        v-on:focus="searchPlaylists"
        ref="input"
        placeholder="Type something or paste a Spotify link..."
        v-model="searchTerm"
      />
    </form>

    <div class="search-results">
      <div v-if="!loading">
        <div v-if="!playlists" class="search-results__info">
          <p>Search by text or paste a spotify link</p>
        </div>
        <div
          v-if="playlists && playlists.playlists.items.length == 0"
          class="search-results__info"
        >
          <p>Nothing here :(</p>
        </div>
        <ul v-if="playlists && playlists.playlists.items.length > 0" class="search-list">
          <li v-for="track in playlists.playlists.items" :key="track.id">
            <track-item :track="track"></track-item>
          </li>
        </ul>
      </div>
      <div v-show="loading" class="search-results__info">
        <img
          src="@/assets/spinner.svg"
          alt="LOADING SPINER"
          class="search-results__spinner"
        />
      </div>
      </div>-->
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";
import debounce from "../common/debounce";
import storage from "@/common/device-storage";
import QRCode from "qrcode";

export default {
  created() {
    // this.genWifiQR();
    this.$store.watch(state => state.Session.wifiQR, () => this.genWifiQR());
  },

  data() {
    return {
      searchTerm: null,
      loading: false,
      error: null,
      playlists: null,
      backupUrl: null,
      partyResult: null,
      partySearchTerm: null,
      device: null,
      devices: null,
      baseURL: "http://" + storage.get("serverIP") + ":3000",
      authUrls: {
        facebook: "/auth/facebook",
        spotify: "/auth/spotify-host",
        spotifyLogin: "/auth/spotify-host-login",
      },
      wifiCredentials: {
        ssid: "",
        password: "",
        encryption: "",
      },
    };
  },

  computed: {
    ...mapGetters({
      user: "Session/user",
      player: "Spotify/player",
      queue: "Queue/queue",
      currentTrack: "Queue/currentTrack",
      backupPlaylist: "Queue/backupPlaylist",
      wifiQR: "Session/wifiQR",
    }),
  },

  beforeMount: function() {
    if (this.$route.query.access_token && this.$route.query.refresh_token) {
      // complete the request chain
      var state = this.$route.query.state || "host";
      var params = {
        access_token: this.$route.query.access_token,
        refresh_token: this.$route.query.refresh_token,
      };
      var promise = null;

      switch (state) {
        case "host":
          promise = api.spotify.createSpotifyHost(params);
          break;
        case "auth":
          promise = api.spotify.authenticateSpotifyHost(params);
          break;
      }

      promise
        .then(() => {
          window.location.href = "/host";
        })
        .catch(() => {
          this.error = "something went wrong";
        });
    } else if (this.$route.query.success == "false") {
      this.error = "something went wrong";
    }

    if (this.user && this.user.host && this.user.host.id) {
      api.spotify.getDevices().then(data => {
        this.devices = data.devices;

        var device = this.devices.find(function(d) {
          return d.is_active;
        });
        if (device) {
          this.device = device.id;
        }
      });

      this.searchParties();
    }
  },

  methods: {
    createSpotifyHost: () => {
      api.spotify.createSpotifyHost().then(r => {
        window.location.href = r.url;
      });
    },

    searchPlaylists(e) {
      if (!e.target.value) {
        this.playlists = null;
        return;
      }

      this.loading = true;
      this.debounceSearch(e);
    },

    play() {
      api.queue.play();
    },
    pause() {
      api.queue.pause();
    },
    previous() {
      api.queue.previous();
    },
    playNext() {
      api.queue.playNext();
    },
    playPlaylist() {
      api.queue.play(true);
    },
    emptyPlaylist() {
      api.queue.emptyPlaylist();
    },
    emptyQueue() {
      api.queue.emptyQueue();
    },

    setActiveDevice(device) {
      api.spotify.setActiveDevice(device);
    },

    setBackupPlaylist(uri) {
      api.queue.setBackupPlaylist(uri);
    },

    changePartyName() {
      var name = prompt("Change party name", this.user.host.name);
      if (name) {
        api.spotify.setPartyName(name).then(data => {
          location.reload();
        });
      }
    },
    searchParties() {
      api.queue
        .searchParties(this.partySearchTerm)
        .then(r => {
          this.partyResult = r.result;
        })
        .catch(r => {
          this.partyResult = null;
        });
    },
    setParty(id) {
      api.queue
        .setParty(id)
        .then(r => {
          location.reload();
        })
        .catch(r => {
          console.log(r);
        });
    },
    setWifiCredentials(e) {
      e.preventDefault();
      api.axios.post("wifi", this.wifiCredentials).then(string => {
        this.$store.commit("Session/SET_WIFI_QR", string);
        this.genWifiQR(string);
      });
    },
    genWifiQR(qr = this.wifiQR) {
      setTimeout(() => {
        QRCode.toCanvas(this.$refs.wifiCanvas, qr, err => {
          if (err) {
            console.error(err);
          }
        });
      });
    },
  },

  mounted: function() {
    this.baseURL = "http://" + storage.get("serverIP") + ":3000";
  },
};
</script>

<style lang="scss">
@import "../assets/variables.scss";

#welcome {
  padding: 1em 0 0;
  text-align: center;
}

.container {
  margin-bottom: 3em;
  padding: 0 1em;
}

.host-container {
  margin: 0 auto;
  width: 100%;
  height: 100%;
  max-width: 800px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: $background;
}

.start-btn {
  border: none;
  border-radius: 4px;
  padding: 1em 1.4em;
  font-size: 1.5em;
  font-weight: bold;
  cursor: pointer;
  width: 80%;
  margin-bottom: 1em;

  &__join {
    background: #1db954;
    color: white;
  }

  &__host {
    background: none;
    color: #fff;
    border: 1px solid #444;
  }
}

.start-playback-btn {
  padding: 0.5em 1em;
  font-size: 1.2em;
  background: #1db954;
  color: white;

  &:disabled {
    background: #aaa;
  }
}

.login {
  text-align: center;
  font-size: 1.2em;
}

a,
a:visited,
a:link {
  color: #aaa;
}
a:active,
a:hover {
  color: #fff;
}

.current-track.current-track_compact {
  display: flex;
  align-items: center;

  img {
    width: 2.5em;
  }

  .current-track__track-info {
    flex: 1;
    padding-left: 1em;
  }
}
</style>
