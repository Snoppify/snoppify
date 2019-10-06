<template>
  <div id="track" class="route-container route-container_overlay">
    <div v-if="track">
      <div class="track_title">
        <div class="track_title_back-button">
          <router-link to="/party" tag="div">&lt;</router-link>
        </div>

        <h1 class="track_title_name">{{ track.name }}</h1>
      </div>

      <div class="track-hr"></div>

      <div class="track_image">
        <img v-if="track.album" :src="track.album.images[1].url" alt />
      </div>

      <div class="track_info">
        <div class="track_snoppify">
          <div v-if="!track.snoppify">
            <button v-on:click="queueTrack(track)" class="snopp-btn snopp-btn--light">Queue track</button>
          </div>

          <div v-if="track.snoppify">
            <p>
              Added by
              <b>{{ track.snoppify.issuer.displayName }}</b>
            </p>
            <p class="track_snoppify_row">
              Votes:
              <span
                class="snopp-vote-btn"
                v-bind:class="{
                  active: track.snoppify.votes.indexOf(username) != -1,
                }"
                v-on:click="vote(track)"
              >
                <div class="arrow-up" v-if="track.snoppify.votes.length > 0"></div>
                <div>{{ track.snoppify.votes.length }}</div>
              </span>
            </p>
            <button
              v-if="
                track.snoppify && track.snoppify.issuer.username == username
              "
              v-on:click="dequeueTrack(track)"
              class="snopp-btn snopp-btn--light"
            >Dequeue track</button>
          </div>

          <hr />
        </div>

        <h3>
          Artist
          <span v-if="track.artists.length > 1">s</span>
        </h3>
        <p>
          <span v-for="(artist, index) in track.artists" :key="index">
            <span>{{ artist.name }}</span>
            <span v-if="index + 1 < track.artists.length">,</span>
          </span>
        </p>
        <h3>Album</h3>
        <p>{{ track.album.name }}</p>
        <h3>Audio features</h3>
        <ul>
          <li v-for="(val, key) in track.audio_features" :key="key">
            <i>{{ key }}</i>
            : {{ val }}
          </li>
        </ul>
      </div>
    </div>
    <div v-else>
      <p>Track not found</p>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";

export default {
  props: ["id"],

  data() {
    return {
      track: null,
    };
  },

  created() {
    this.getTrack();
  },

  computed: {
    ...mapGetters({
      user: "Session/user",
      username: "Session/username",
    }),
  },

  methods: {
    getTrack() {
      api.spotify.getTrack(this.id).then(r => {
        this.track = r;
      });
    },

    queueTrack(track) {
      api.queue.queueTrack(track.id).then(() => this.getTrack());
    },
    dequeueTrack(track) {
      api.queue.dequeueTrack(track.id).then(() => this.getTrack());
    },
    vote(track) {
      if (track.snoppify.issuer.id === this.user.id) {
        return;
      }

      let func, i;
      if ((i = track.snoppify.votes.indexOf(this.username)) == -1) {
        func = "vote";
        track.snoppify.votes.push(this.username);
      } else {
        func = "unvote";
        track.snoppify.votes.splice(i, 1);
      }
      api.queue[func](track.id);
    },
  },

  sockets: {
    event: (state, event) => {
      console.log(event);
    },
  },
};
</script>

<style lang="scss">
@import "../assets/variables.scss";

#track {
  // background: $background;
  // color: #444;
}

.track-hr {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin: 1em;
  display: block;
}

.track_title {
  position: relative;
  margin: 2em 0 1.5em;
  display: flex;
  flex-direction: row;

  $title_font-size: 1.2em;

  &_back-button {
    line-height: $title_font-size;
    font-size: 1.5em;
    font-weight: bold;
    width: 7%;
    margin-left: 3%;
    position: relative;
    top: -4px;
  }

  &_name {
    padding: 0;
    margin: 0;
    line-height: $title_font-size;
    font-size: $title_font-size;
    width: 80%;
  }
}

@media screen and (max-width: 480px) {
  .track_title {
    font-size: 0.8em;
  }
}

.track_name {
  font-size: 1.2em;
}

.track_info {
  //font-size: 0.8em;
  margin: 2em;

  h3 {
    font-size: 0.9em;
    margin-top: 0.5em;
    margin-bottom: 0;
  }

  p {
    margin: 0.1em 0;
  }
}

.track_image {
  position: relative;
  width: 300px;
  margin: auto;
  margin-bottom: 30px;
  height: 300px;
  text-align: left;
  border: 1px solid hsla(0, 0%, 26%, 1);

  img {
    width: 100%;
  }
}

.track_snoppify {
  font-size: 1.2em;

  &_row {
    display: flex;
    align-items: flex-start;
  }
}
</style>
