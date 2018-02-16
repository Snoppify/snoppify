<template>
<div id="vote" class="route-container">
	<div v-if="track">
		<h1>{{track.name}}</h1>

		<div class="vote-hr"></div>

		<div class="track_info">
		<h3>Artist<span v-if="track.artists.length > 1">s</span></h3>
		<p>
			<span v-for="(artist, index) in track.artists">
			<span>{{artist.name}}</span><span v-if="index+1 < track.artists.length">, </span>
			</span>
		</p>
		<h3>Album</h3>
		<p>{{track.album.name}}</p>
		<h3>Audio features</h3>
		<ul>
			<li v-for="(val, key) in track.audio_features">
				<i>{{key}}</i>: {{val}}
			</li>
		</ul>
		</div>
	</div>
	<div v-else>
		<p>Track not found</p>
	</div>

    <router-link to="/">Home</router-link>
</div>
</template>

<script>
export default {
	props: ['id'],

	created() {
		this.$store.dispatch("Spotify/getTrack", this.id);
	},

	computed: {
		track() {
	      return this.$store.getters["Spotify/track"](this.id);
	    },
	},
}
</script>

<style lang="scss">

.vote-hr {
	border-bottom: 1px solid rgba(0,0,0,0.1);
	margin: 1em;
	display: block;
}

.track_name {
	font-size: 1.2em;
}

.track_info {
	font-size: 0.8em;
	margin-bottom: 2em;

	h3 {
		font-size: 0.9em;
		margin-top: 0.5em;
		margin-bottom: 0;
	}

	p {
		margin: 0.1em 0;
	}
}

#vote {
  background: #cff7ed;
}
</style>
