<template>
  <div id="home" class="route-container">
    <h1>Snoppify</h1>

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

    <ul v-if="queue">
      <li v-for="track in queue" v-bind:key="track.id">
        {{track.name}} ({{ track.artists[0].name }}) added by <b>{{track.issuer}}</b>
      </li>
    </ul>

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
      queue: "Events/queue",
      connected: "Spotify/connected",
      result: "Spotify/result",
      username: "Session/username"
    })
  },

  methods: {
    search() {
      this.$store.dispatch("Spotify/search", this.searchQuery);
    },
    queueTrack(track) {
      api.queue.queueTrack(track.id);
    },
    play(){
      api.queue.play();
    },
    pause(){
      api.queue.pause();
    },
    previous(){
      api.queue.previous();
    },
    next(){
      api.queue.next();
    },
    playPlaylist(){
      api.queue.play(true);
    },
    emptyPlaylist(){
      api.queue.emptyPlaylist();
    },
    emptyQueue() {
      api.queue.emptyQueue();
    }
  }
};
</script>

<style lang="scss">
#track-list {
  text-align: left;
  max-width: 600px;
  margin: 20px auto;
}

#home {
  background: #ffdffa;
}
</style>
