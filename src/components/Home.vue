<template>
  <div id="home" class="route-container">
    <header>
      <div class="title">— Snoppify —</div>
      <search-dropdown :options="{ search: 'Search term' }"></search-dropdown>
    </header>

    <h1 v-if="player.isPlaying">Now playing</h1>
    <h1 v-else>Paused</h1>

    <div class="current-track" v-if="currentTrack">
      <img
        v-if="currentTrack.album"
        :src="currentTrack.album.images[1].url"
        alt
      />
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
          <div class="upvotes">
            {{ currentTrack.snoppify.votes.length }} upvotes
          </div>
        </div>
      </div>
    </div>

    <div class="progress" v-if="player.status">
      <div class="progress_inner">
        <div
          class="progress_inner_bar"
          v-bind:style="{ width: 100 * player.status.fraction + '%' }"
        ></div>
      </div>
      <div class="progress_status">
        <span>{{ player.status.progress }}</span>
        <span>{{ player.status.duration }}</span>
      </div>
    </div>

    <h1>Queue</h1>
    <transition-group name="song-list" v-if="queue" tag="ul" class="song-list">
      <li v-for="(track, index) in queue" v-bind:key="track.id">
        <track-item :track="track" :index="index + 1"></track-item>
      </li>
    </transition-group>

    <h1>Friends</h1>

    <div class="friends-container">
      <button
        :disabled="user.friends.length == 0"
        v-on:click="showFriends()"
        class="friends-button"
      >
        Show your {{ user.friends.length }}
        <span v-if="user.friends.length == 1">friend</span>
        <span v-else>friends</span>
      </button>
    </div>

    <hr />

    <div>
      <h1>Share the party!</h1>
      <p>
        <button
          style="margin: auto"
          class="snopp-btn"
          @click="
            showShareModal = true;
            generateShareQR();
            generateWifiQR();
          "
        >
          Share party!
        </button>
      </p>
      <modal v-if="showShareModal" @close="showShareModal = false">
        <!--
      you can use custom content here to overwrite
      default content
        -->
        <div slot="body">
          <h1>SnoppiCode</h1>
          <p class="share-snoppi-code">{{ snoppiCode }}</p>
          <h1>Join the party!</h1>
          <div class="share-qr-code">
            <canvas ref="qrCanvas"></canvas>
          </div>
          <div v-if="wifiQR">
            <h1>Connect to wi-fi</h1>
            <div class="share-qr-code">
              <canvas ref="wifiQRCanvas"></canvas>
            </div>
          </div>
        </div>
      </modal>
    </div>

    <hr />

    <p>
      Logged in as
      <b>{{ user.displayName }}</b>
    </p>

    <form action="/logout">
      <input type="submit" value="Logout" class="snopp-btn" />
    </form>

    <hr />

    <h1>Make some noise</h1>

    <div class="soundboard">
      <button
        v-for="sound in [
          'honk',
          'applause',
          'orgasm',
          'whistle',
          'yeah',
          'wilhelm',
          'airhorn',
          'brrrap',
          'rastafari',
          'inception',
          'mario1',
          'mario2',
          'mario3',
          'yoshi1',
          'yoshi2',
          'yoshi3',
        ]"
        v-bind:key="sound"
        v-on:click="playSound(sound)"
        class="soundboard__btn snopp-btn"
      >
        {{ sound }}
      </button>
    </div>

    <div v-if="user.admin">
      <hr />
      <button v-on:click="play">Play</button>
      <button v-on:click="pause">Pause</button>
      <button v-on:click="playNext">Next track</button>
      <br />
      <button v-on:click="playPlaylist">Play playlist</button>
      <button v-on:click="emptyPlaylist">Empty playlist</button>
      <button v-on:click="emptyQueue">Empty queue</button>

      <br />

      <form v-on:submit.prevent="setBackupPlaylist(backupUrl)">
        <input v-model="backupUrl" placeholder="Paste a playlist uri" />
        <button type="submit">Set</button>
      </form>
      <p>
        Backup playlist:
        <span v-if="backupPlaylist">
          <b>{{ backupPlaylist.name }}</b>
          ({{ backupPlaylist.owner.display_name }})
        </span>
        <span v-else>(not set)</span>
      </p>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";
import codeWords from "../common/code-words";
import * as QRCode from "qrcode";

// components
import SearchDropdown from "./SearchDropdown";
import TrackItem from "./TrackItem";

export default {
  components: {
    searchDropdown: SearchDropdown,
  },

  data() {
    return {
      searchQuery: "",
      showShareModal: false,
      snoppiCode: codeWords.getCode(location.hostname),
    };
  },

  computed: {
    ...mapGetters({
      event: "Events/event",
      connected: "Spotify/connected",
      result: "Spotify/result",
      player: "Spotify/player",
      user: "Session/user",
      username: "Session/username",
      queue: "Queue/queue",
      currentTrack: "Queue/currentTrack",
      backupPlaylist: "Queue/backupPlaylist",
      wifiQR: "Session/wifiQR",
    }),
  },

  methods: {
    search() {
      this.$store.dispatch("Spotify/search", this.searchQuery);
    },
    setBackupPlaylist(uri) {
      api.queue.setBackupPlaylist(uri);
    },
    queueTrack(track) {
      api.queue.queueTrack(track.id);
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

    playSound(sound) {
      api.misc.playSound(sound);
    },

    generateShareQR() {
      setTimeout(() => {
        QRCode.toCanvas(
          this.$refs.qrCanvas,
          `http://${location.hostname}/new-user`,
          function (error) {
            if (error) console.error(error);
          },
        );
      });
    },

    generateWifiQR() {
      if (!this.wifiQR) {
        return;
      }

      setTimeout(() => {
        QRCode.toCanvas(this.$refs.wifiQRCanvas, this.wifiQR, (err) => {
          if (err) {
            console.error(err);
          }
        });
      });
    },

    showFriends() {
      this.$store.dispatch("Messages/popup", {
        type: "deepsea",
        html:
          "<h2>Your friends:</h2>" +
          (this.user.friends.length == 0 ? "<p>No friends yet :(</p>" : "") +
          this.user.friends
            .map((f) => {
              var html = f.displayName;
              var given = this.user.votes.given[f.username]
                ? this.user.votes.given[f.username]
                : 0;
              var received = this.user.votes.received[f.username]
                ? this.user.votes.received[f.username]
                : 0;
              if (given > received) {
                html += " (you upvoted " + given + " times)";
              } else if (received > given) {
                html += " (upvoted you " + received + " times)";
              } else {
                html += " (" + received + " upvotes)";
              }
              return "<p>" + html + "</p>";
            })
            .join(""),
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../assets/variables.scss";

hr {
  margin-left: 20px;
  margin-right: 20px;
  border: 0.5px solid $darkgray;
}

#track-list {
  text-align: left;
  max-width: 600px;
  margin: 20px auto;
}

#home {
  // background: $background;
}

$current-track__border-radius: 4px;

.current-track {
  position: relative;
  width: 300px;
  margin: auto;
  margin-bottom: 15px;
  height: 300px;
  text-align: left;
  border: 1px solid hsla(0, 0%, 26%, 1);
  border-radius: $current-track__border-radius;
  overflow: hidden;

  img {
    width: 100%;
    border-radius: $current-track__border-radius - 1px;
  }
}

.current-track__user-info {
  position: absolute;
  top: 0;
  display: flex;
  left: 0;
  right: 0;
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.8);
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  border-top-left-radius: $current-track__border-radius - 1px;
  border-top-right-radius: $current-track__border-radius - 1px;

  .user-image {
    width: 60px;
    height: 60px;
    background-size: cover;
    background-position: center;
    border-radius: 100px;
    margin-right: 15px;
    flex-shrink: 0;
    border: 1px solid white;
  }

  .user {
    text-align: right;
  }

  .title {
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 0.7em;
    margin-bottom: 0.4em;
  }

  .name {
    color: white;
    overflow: hidden;
    word-break: break-all;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .upvotes {
    font-size: 0.9em;
  }
}

.current-track__track-info {
  position: absolute;
  padding: 20px 15px 15px;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  font-size: 1.1em;
  text-shadow: 1px 1px 5px black;
  border-bottom-left-radius: $current-track__border-radius - 1px;
  border-bottom-right-radius: $current-track__border-radius - 1px;

  .artist {
    font-size: 0.8em;
  }

  .title {
    color: white;
  }
}

.song-list {
  border-top: 1px solid $darkgray;

  .track-item {
    background: linear-gradient($background, #272727);
  }
}

.song-list-move {
  transition: transform 0.6s;
}

/* progress */
.progress {
  $progress_width: 300px;

  display: block;
  padding: 0.5em 1em;

  &_inner {
    border-radius: 99px;
    background: #444;
    height: 0.5em;
    overflow: hidden;

    max-width: $progress_width;
    margin: 0 auto;

    &_bar {
      display: block;
      height: 100%;
      transition: all 0.6s;
      background: #24cf5f;
    }
  }

  &_status {
    font-size: 0.8em;
    display: flex;
    justify-content: space-between;

    max-width: $progress_width;
    margin: 3px auto;
  }
}

.share-snoppi-code {
  font-size: 1.5em;
  background: #282828;
  color: #a9a9a9;
  font-family: monospace;
  padding: 0.5em 0.8em;
  text-align: center;
}

.share-qr-code {
  ::v-deep canvas {
    height: 148px;
    width: 148px;
    margin: auto;
    display: block;
  }
}

.friends-container {
  width: 100%;
  text-align: center;
}

.friends-button {
  background: linear-gradient(to right, transparent, #1f9eb3),
    linear-gradient(to right, rgba(183, 63, 175, 0.3), rgba(57, 15, 84, 0.75)),
    linear-gradient(to top right, #701cbd, transparent),
    radial-gradient(closest-corner at 20% 80%, #51983f, #263238);
  color: white;
  margin: 1em auto;
  font-size: 1.4em;
  padding: 0.6em 1em;

  &:disabled {
    background: none;
    border: 1px solid white;
    opacity: 0.2;
  }
}

.soundboard {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  &__btn {
    width: 120px;
    height: 120px;
    margin: 10px;
    background: $background;
    border: 2px solid $darkgray;
    border-radius: 4px;
  }
}
</style>
