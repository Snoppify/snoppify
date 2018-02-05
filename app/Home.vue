<template>
	<div id="home">
		<h1>Home</h1>

		<p v-if="isConnected">We're connected to the server!</p>
		<form v-on:submit.prevent="search()">
		<input v-model="searchQuery" placeholder="Search song, artist, album...">
	    <button type="submit">Search</button>
		</form>

		<ul v-if="socketMessage" id="track-list">
			<li v-for="track in socketMessage.tracks.items">
				<b>{{ track.type }}:</b> {{ track.name }} ({{ track.artists[0].name }})
			</li>
		</ul>
	</div>
</template>

<script>
export default {
  data() {
    return {
      isConnected: false,
      searchQuery: '',
      socketMessage: ''
    }
  },

  sockets: {
    connect() {
      this.isConnected = true;
    },

    disconnect() {
      this.isConnected = false;
    },

    search(data) {
    	this.socketMessage = JSON.parse(data)
    }
  },

  methods: {
    search() {
      this.$socket.emit('search', this.searchQuery)
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
</style>
