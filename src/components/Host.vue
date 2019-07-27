<template>
  <div class="route-container">
    <div class="container">
    <h1>Host a Snoppify party!</h1>

    <p v-if="error"><b>{{ error }}</b></p>

    <div v-if="user.host">

      <div v-if="user.host.id">
      
        <p>ID: {{user.host.id}}</p>
        <p>Hoster: {{user.username}}</p>
      
      </div>
      <div v-else>

        <p>You are authorized as <b>{{ user.username }}</b>.</p>

        <button v-on:click="createSpotifyHost()">
          Host a party!
        </button>
      
      </div>

      <p>
        Logged in as
        <b>{{ user.displayName }}</b>
      </p>

      <form action="/logout">
        <input type="submit" value="Logout" class="snopp-btn" />
      </form>

    </div>
    <div v-else>

      <form v-bind:action="authUrls.spotify" class="auth auth--spotify">
        <input type="submit" value="Auth with Spotify" />
      </form>

    </div>

    <!-- <form v-on:submit.prevent="" class="search-input">
      <input
        v-on:input="searchPlaylists"
        v-on:focus="searchPlaylists"
        ref="input"
        placeholder="Type something or paste a Spotify link..."
        v-model="searchTerm"
      />
    </form>

    <div class="search-results">
      <div v-if="!loading">
        <div v-if="!playlists" class="search-results__info">
          <p>Search by text or paste a spotify link</p>
        </div>
        <div
          v-if="playlists && playlists.playlists.items.length == 0"
          class="search-results__info"
        >
          <p>Nothing here :(</p>
        </div>
        <ul v-if="playlists && playlists.playlists.items.length > 0" class="search-list">
          <li v-for="track in playlists.playlists.items" :key="track.id">
            <track-item :track="track"></track-item>
          </li>
        </ul>
      </div>
      <div v-show="loading" class="search-results__info">
        <img
          src="@/assets/spinner.svg"
          alt="LOADING SPINER"
          class="search-results__spinner"
        />
      </div>
    </div> -->
    </div>
  </div>
</template>

<script>

import { mapGetters } from "vuex";
import api from "../api";
import debounce from "../common/debounce";

export default {
  data() {
    return {
        searchTerm: null,
        loading: false,
        error: null,
        playlists: null,
        authUrls: {
          facebook: api.axios.defaults.baseURL + "/auth/facebook",
          spotify: api.axios.defaults.baseURL + "/auth/spotify-host",
        },
    };
  },

  computed: {
    ...mapGetters({
      user: "Session/user",
    })
  },

  beforeMount: function() {
    if (this.$route.query.success == "true") {
      // complete the request chain
      api.spotify.createSpotifyHost({
        check: true,
      }).then(() => {
        window.location.href = "/host";
      }).catch(() => {
        this.error = "something went wrong";
      });
    } else if (this.$route.query.success == "false") {
      this.error = "something went wrong";
    }
  },

  methods: {
    createSpotifyHost: () => {
        api.spotify
            .createSpotifyHost()
            .then(r => {
              window.location.href = r.url;
            });
    },

    searchPlaylists(e) {
      if (!e.target.value) {
        this.playlists = null;
        return;
      }

      this.loading = true;
      this.debounceSearch(e);
    },
  },
};
</script>

<style lang="scss">
@import "../assets/variables.scss";

#welcome {
  padding: 1em 0 0;
  text-align: center;
}

.container {
  margin-bottom: 3em;
  padding: 0 1em;
}

.logo {
  width: 50%;
  display: block;
  margin: 3em auto;
}

.start-btn {
  border: none;
  border-radius: 4px;
  padding: 1em 1.4em;
  font-size: 1.3em;
  font-weight: bold;
  cursor: pointer;
  width: 80%;
  margin-bottom: 1em;

  &__join {
    background: #1db954;
    color: white;
  }

  &__host {
    background: none;
    color: #fff;
    border: 1px solid #444;
  }
}
</style>
