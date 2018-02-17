<template>
  <div id="home" class="route-container">
    <h1>Snoppify</h1>

    <p v-if="connected">We're connected to the server!</p>
    <p v-else>Not connected</p>
    
    <p>You are user: {{username}}</p>
    
    <form v-on:submit.prevent="search()">
      <input v-model="searchQuery" placeholder="Search song, artist, album...">
      <button type="submit">Search</button>
    </form>

    <ul v-if="result" id="track-list">
      <li v-for="track in result.tracks.items" v-bind:key="track.id">
        <router-link :to="{path: '/vote/' + track.id}"><b>{{ track.type }}:</b> {{ track.name }} ({{ track.artists[0].name }})</router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      searchQuery: ""
    };
  },

  computed: {
    ...mapGetters({
      connected: "Spotify/connected",
      result: "Spotify/result",
      username: "Session/username"
    })
  },

  methods: {
    search() {
      this.$store.dispatch("Spotify/search", this.searchQuery);
    },
    createUser() {
      this.$store.dispatch("Session/CREATE_SESSION", this.username);
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
