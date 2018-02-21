<template>
  <div id="home" class="route-container">
    <header>
      <div class="title">
        Snoppify
      </div>
    </header>

    <h1>Now playing</h1>
    <div class="current-track">
      <img :src="currentTrack.album.images[1].url" alt="">
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
        <div class="image" :style="{'background-image':'url(https://www.billboard.com/files/styles/article_main_image/public/media/jack-dorsey-twitter-headshot-2015-billboard-650.jpg)'}">

        </div>
        <div class="user">
          <div class="title">Added by</div>
          <div class="name">Danne mannen dickdock</div>
          <div class="upvotes">256 upvotes</div>
        </div>
      </div>
    </div>

    <h1>Queue</h1>
    <ul v-if="queue">
      <li v-for="(track, index) in queue" v-bind:key="index">
         <div class="title">
          {{track.name}}
        </div>
        <div class="artist">
            <span v-for="(artist, index) in track.artists" :key="index">
              <span>{{artist.name}}</span><span v-if="index+1 < track.artists.length">, </span>
            </span>
        </div>
        <div>added by <b>{{track.issuer}}</b></div>
        
      </li>
    </ul>
    
    <p v-if="connected">We're connected to the server!</p>
    <p v-else>Not connected</p>
    
    <p>You are user: {{username}}</p>

    <p v-if="event">
      <b>{{event.type}}</b><br/>
      <span v-if="event.data.track">
        {{event.data.track.name}} ({{event.data.track.artists[0].name}})
        <span v-if="event.data.track.issuer">added by <b>{{event.data.track.issuer}}</b></span>
      </span>
      <span v-else>
        {{event.data}}
      </span>
    </p>

    <h2>Queue</h2>


    <hr/>

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
    </ul>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";

export default {
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
#track-list {
  text-align: left;
  max-width: 600px;
  margin: 20px auto;
}

#home {
  // background: $background;
}

.current-track {
  margin-bottom: 30px;
  position: relative;
  width: 300px;
  margin: auto;
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
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.8);
  justify-content: space-between;
  align-items: center;
  overflow: hidden;

  .image {
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
  padding: 20px 20px 10px;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));

  .artist {
    font-size: 0.8em;
  }

  .title {
    color: white;
  }
}
</style>
