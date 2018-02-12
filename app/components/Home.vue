<template>
	<div id="home" class="route-container">
		<h1>Home</h1>

    <router-link to="/vote">Vote</router-link>

    <p v-if="connected">We're connected to the server!</p>
    <p v-else>Not connected</p>
		<form v-on:submit.prevent="search()">
		<input v-model="searchQuery" placeholder="Search song, artist, album...">
	    <button type="submit">Search</button>
		</form>

		<ul v-if="result" id="track-list">
			<li v-for="track in result.tracks.items">
				<b>{{ track.type }}:</b> {{ track.name }} ({{ track.artists[0].name }})
			</li>
		</ul>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      searchQuery: '',
    }
  },

  computed: {
    ...mapGetters({
      connected: 'Spotify/connected',
      result: 'Spotify/result',
    })
  },

  methods: {
    search() {
      this.$store.dispatch("Spotify/search", this.searchQuery);
    }
  }
}
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
