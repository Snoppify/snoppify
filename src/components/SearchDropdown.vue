<template>
  <div id="search-dropdown" v-on:click="!show && focusSearch()">
    <form v-on:submit.prevent="" class="search-input">
      <input v-on:input="search" v-on:focus="search" ref="input" placeholder="Type something or paste a Spotify link..." v-model="searchTerm" v-bind:class="{active:show}">
      <!-- <button type="submit">Search</button> -->
    </form>

    <transition name="search-backdrop">
      <div v-if="show" class="search-backdrop" v-on:click.stop.prevent="blurSearch"></div>
    </transition>

    <div class="search-results" v-if="show">
      <div v-if="!loading">
        <div v-if="!result" class="search-results__info">
          <p>Search by text or paste a spotify link</p>
        </div>
        <div v-if="result && result.tracks.items.length == 0" class="search-results__info">
          <p>Nothing here :(</p>
        </div>
        <ul v-if="result && result.tracks.items.length > 0" class="search-list">
          <li v-for="track in result.tracks.items" :key="track.id">
            <track-item :track="track"></track-item>
          </li>
        </ul>
      </div>
      <div v-show="loading" class="search-results__info">
        <img src="spinner.svg" alt="LOADING SPINER" class="search-results__spinner">
      </div>
    </div>
  </div>
</template>

<script>
import api from "../api";
import debounce from "../common/debounce";
import { mapGetters } from "vuex";

export default {
  props: {},

  data() {
    return {
      show: false,
      searchTerm: null,
      result: null,
      loading: false,
    };
  },

  computed: {
    ...mapGetters({
      user: "Session/user",
      username: "Session/username",
    }),
  },

  methods: {
    focusSearch() {
      this.$nextTick(() => {
        this.show = true;
        this.$refs.input.focus();
      });
    },

    blurSearch(event) {
      this.$nextTick(() => {
        this.show = false;
        this.result = null;
      });
    },

    debounceSearch: debounce(function(e) {
      api.spotify
        .search(e.target.value)
        .then(r => {
          console.log(r, this);
          this.result = r;
        })
        .catch(r => {
          this.result = null;
        })
        .finally(() => {
          this.loading = false;
        });
    }, 200),

    search(e) {
      if (!e.target.value) {
        this.result = null;
        return;
      }

      this.loading = true;
      this.debounceSearch(e);
    },

    queueTrack(track) {
      this.$nextTick(() => {
        this.blurSearch();
      });
    },
  },
};
</script>

<style scoped lang="scss">
@import "../assets/variables.scss";

#search-dropdown {
  position: relative;
}

.search-input {
  display: flex;
  padding: 0.2em 20px 0.4em;

  input {
    flex: 1;

    outline: none;
    border: none;
    border-radius: 3px;

    background: #555;
    color: #000;
    padding: 0.3em 0.8em;
    font-size: 1em;

    transition: 0.6s all cubic-bezier(0.09, 1, 0.36, 1);

    &::placeholder {
      color: #222;
    }

    &.active {
      background: #aaa;
      color: #333;
      padding: 0.8em 0.8em;

      &::placeholder {
        color: #666;
      }
    }
  }
}

.search-backdrop {
  position: fixed;
  left: -5px;
  right: -5px;
  height: 100vh;

  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
}
.search-backdrop-enter-active {
  transition: all 0.5s ease;
}
.search-backdrop-leave-active {
  transition: all 0.5s ease;
}
.search-backdrop-enter,
.search-backdrop-leave-to {
  opacity: 0;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;

  margin: 0;
  background: $background-light;
  z-index: 100;
  max-height: 70vh;
  overflow-y: auto;

  &__info {
    text-align: center;
    font-size: 1.2em;
    padding: 2em 0;
    color: #666;
  }

  &__spinner {
    @keyframes spin {
      0% {
        transform: rotateZ(0deg);
      }
      100% {
        transform: rotateZ(2*360deg);
      }
    }

    @keyframes fadeIn {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }

    width: 100px;
    animation: spin 2s infinite cubic-bezier(0.2, 0.2, 0.4, 1), fadeIn 0.5s;
    transform-origin: 50% 60%;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
.search-list .track-item__info {
  font-size: 0.8em;
}
</style>
