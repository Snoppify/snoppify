<template>
  <div id="home" class="route-container">
    <header>
      <div class="title">
        Snoppify
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
              <span>{{artist.name}}</span><span v-if="index+1 < currentTrack.artists.length">, </span>
            </span>
        </div>
      </div>
      <div class="current-track__user-info">
        <div class="user-image" :style="{'background-image':'url(https://www.billboard.com/files/styles/article_main_image/public/media/jack-dorsey-twitter-headshot-2015-billboard-650.jpg)'}">

        </div>
        <div class="user">
          <div class="title">Added by</div>
          <div class="name">Danne mannen dickdock</div>
          <div class="upvotes">256 upvotes</div>
        </div>
      </div>
    </div>

    <h1>Queue</h1>
    <transition-group name="song-list" v-if="queue" tag="ul">
      <li v-for="(track, index) in queue" v-bind:key="track.id" class="song-list__item">
        <div class="song-list__item__info">
          <span class="artist">
              <span v-for="(artist, index) in track.artists" :key="index">
                <span>{{artist.name}}</span><span v-if="index+1 < track.artists.length">, </span>
              </span>
          </span>
          - 
          <span class="title">
            {{track.name}}
          </span>
          <div class="user">
            <div class="user-image" :style="{'background-image':'url(https://www.billboard.com/files/styles/article_main_image/public/media/jack-dorsey-twitter-headshot-2015-billboard-650.jpg)'}"></div>
            <div>{{track.snoppify.issuer}}</div>
          </div>
        </div>
        <div class="song-list__item__action-btn"
          v-bind:class="{active:track.snoppify.votes.indexOf(username) != -1}"
          v-on:click="vote(track)">
            <div class="arrow-up" v-if="track.snoppify.votes.length > 0"></div>
            <div>{{track.snoppify.votes.length}}</div>
        </div>
      </li>
    </transition-group>
    
    <p v-if="connected">We're connected to the server!</p>
    <p v-else>Not connected</p>
    
    <p>You are user: {{username}}</p>

    <form action="/logout">
      <input type="submit" value="Logout" />
    </form>
<!--     
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
        <router-link :to="{path: '/vote/' + track.id}"><b>{{ track.type }}:</b> {{ track.name }} ({{ track.artists[0].name }})</router-link>
        <button v-on:click="queueTrack(track)">Queue</button>
      </li>
    </ul>-->
  </div> 
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";

// components
import SearchDropdown from "./SearchDropdown";

export default {
  components: {
    searchDropdown: SearchDropdown
  },

  data() {
    return {
      searchQuery: ""
    };
  },

  computed: {
    ...mapGetters({
      event: "Events/event",
      connected: "Spotify/connected",
      result: "Spotify/result",
      username: "Session/username",
      queue: "Queue/queue",
      currentTrack: "Queue/currentTrack"
    })
  },

  methods: {
    search() {
      this.$store.dispatch("Spotify/search", this.searchQuery);
    },
    queueTrack(track) {
      api.queue.queueTrack(track.id);
    },
    vote(track) {
      let func, i;
      if ((i = track.snoppify.votes.indexOf(this.username)) == -1) {
        func = "vote";
        track.snoppify.votes.push(this.username);
      } else {
        func = "unvote";
        track.snoppify.votes.splice(i, 1);
      }
      // some delay, so the track does change position immediately
      setTimeout(() => {
        api.queue[func](track.id);
      }, 200);
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
    }
  }
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

.current-track {
  position: relative;
  width: 300px;
  margin: auto;
  margin-bottom: 30px;
  height: 300px;
  text-align: left;
  border-radius: 4px;
  border: 1px solid hsla(0, 0%, 26%, 1);
  overflow: hidden;

  img {
    width: 100%;
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

  .artist {
    font-size: 0.8em;
  }

  .title {
    color: white;
  }
}

.song-list {
  border-top: 1px solid $darkgray;
}

.song-list-move {
  transition: transform 0.6s;
}

.song-list__item {
  border-bottom: 1px solid $darkgray;
  background: linear-gradient($background, #272727);
  display: flex;
  align-items: center;

  &__info {
    width: 100%;
    padding: 10px 20px;
  }

  .title {
    color: white;
  }

  .user {
    display: flex;
    align-items: center;
    margin-top: 7px;
    color: white;
  }

  .user-image {
    width: 20px;
    height: 20px;
    background-size: cover;
    background-position: center;
    border-radius: 100px;
    margin-right: 7px;
    flex-shrink: 0;
    border: 1px solid white;
  }

  &__action-btn {
    width: 3em;
    display: flex;
    align-items: center;
    font-size: 1.2em;
    justify-content: center;
    flex-shrink: 0;
    background: $background;
    border-radius: 4px;
    margin-right: 10px;
    height: 2em;

    .arrow-up {
      $size: 6px;

      width: 0;
      height: 0;
      border-left: $size solid transparent;
      border-right: $size solid transparent;

      border-bottom: $size solid $gray;

      margin-right: 5px;
    }

    &.active {
      background: linear-gradient(hsla(323, 100%, 50%, 1), magenta);
      color: white;

      .arrow-up {
        border-bottom-color: white;
      }
    }
  }
}
</style>
