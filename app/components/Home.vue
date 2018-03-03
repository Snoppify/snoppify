<template>
  <div id="home" class="route-container">
    <header>
      <div class="title">
        — Snoppify —
      </div>
      <search-dropdown :options="{'search': 'Search term'}"></search-dropdown>
    </header>

    <h1>Now playing</h1>
    <div class="current-track" v-if="currentTrack">
      <img v-if="currentTrack.album" :src="currentTrack.album.images[1].url" alt="">
      <div class="current-track__track-info">
        <div class="title">
          {{currentTrack.name}}
        </div>
        <div class="artist">
          <span v-for="(artist, index) in currentTrack.artists" :key="index">
            <span>{{artist.name}}</span>
            <span v-if="index+1 < currentTrack.artists.length">, </span>
          </span>
        </div>
      </div>
      <div class="current-track__user-info" v-if="currentTrack.snoppify">
        <div class="user-image" :style="{'background-image':'url('+currentTrack.snoppify.issuer.profile+')'}">

        </div>
        <div class="user">
          <div class="title">Added by</div>
          <div class="name">{{currentTrack.snoppify.issuer.displayName}}</div>
          <div class="upvotes">{{currentTrack.snoppify.votes.length}} upvotes</div>
        </div>
      </div>
    </div>

    <h1>Queue</h1>
    <transition-group name="song-list" v-if="queue" tag="ul" class="song-list">
      <li v-for="(track, index) in queue" v-bind:key="track.id">
        <track-item :track="track"></track-item>
      </li>
    </transition-group>

    <p>Logged in as <b>{{user.displayName}}</b></p>

    <form action="/logout">
      <input type="submit" value="Logout" class="snopp-btn" />
    </form>

    <div v-if="user.admin">
      <button v-on:click="play">Play</button>
      <button v-on:click="pause">Pause</button>
      <button v-on:click="previous">Previous</button>
      <button v-on:click="next">Next</button>
      <br/>
      <button v-on:click="playPlaylist">Play playlist</button>
      <button v-on:click="emptyPlaylist">Empty playlist</button>
      <button v-on:click="emptyQueue">Empty queue</button>

      <form v-on:submit.prevent="search()">
        <input v-model="searchQuery" placeholder="Search song, artist, album...">
        <button type="submit">Search</button>
      </form>

      <ul v-if="result" id="track-list">
        <li v-for="track in result.tracks.items" v-bind:key="track.id">
          <router-link :to="{path: '/vote/' + track.id}">
            <b>{{ track.type }}:</b> {{ track.name }} ({{ track.artists[0].name }})</router-link>
          <button v-on:click="queueTrack(track)">Queue</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";

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
    };
  },

  computed: {
    ...mapGetters({
      event: "Events/event",
      connected: "Spotify/connected",
      result: "Spotify/result",
      user: "Session/user",
      username: "Session/username",
      queue: "Queue/queue",
      currentTrack: "Queue/currentTrack",
    }),
  },

  methods: {
    search() {
      this.$store.dispatch("Spotify/search", this.searchQuery);
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
    next() {
      api.queue.next();
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
  },
};
</script>

<style lang="scss" scoped>
@import "../assets/variables.scss";

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
  margin-bottom: 30px;
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
</style>
