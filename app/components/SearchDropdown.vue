<template>
  <div id="search-dropdown" v-on:click="focusSearch()">
    <form v-on:submit.prevent="" class="search-input">
      <input v-on:input="search" ref="input" placeholder="Search song, artist, album..."
        v-model="searchTerm"
        v-bind:class="{active:show}"
        >
      <!-- <button type="submit">Search</button> -->
    </form>

    <transition name="search-backdrop">
      <div v-if="show" class="search-backdrop" v-on:click.stop.prevent="blurSearch"></div>
    </transition>

    <div class="search-results">
      <div v-if="show && !result" class="search-results__info">
        <p>Search by text or paste a spotify link</p>
      </div>
      <div v-if="show && result && result.tracks.items.length == 0" class="search-results__info">
        <p>Nothing here :(</p>
      </div>
      <ul v-if="show && result && result.tracks.items.length > 0" class="search-list">
        <li v-for="track in result.tracks.items"
          v-bind:key="track.id"
          class="search-list__item"
          >
          <router-link :to="{path: '/vote/' + track.id}" tag="div"
            class="search-list__item__body"
            >
            {{ track.name }} (<b>{{ track.artists[0].name }}</b>)
          </router-link>
          <div class="search-list__item__buttons">
            <button v-on:click="queueTrack(track)">Queue</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

import api from "../api";
import debounce from "../common/debounce";

export default {
  props: {},

  data() {
    return {
      show: false,
      searchTerm: null,
      result: null,
    };
  },

  methods: {
    focusSearch() {
      this.$nextTick(() => {
        console.log("focus");
        this.show = true;
        this.$refs.input.focus();
      })
    },

    blurSearch(event) {
      this.$nextTick(() => {
        console.log("blur");
        this.show = false;
        this.searchTerm = null;
        this.result = null;
        // if (event) {
        //   event.preventDefault();
        //   event.stopPropagation();
        // }
      })
    },

    search: debounce(function(e){
      console.log("ror", this);
      api.spotify.search(e.target.value).then(r => {
        console.log(r, this);
        this.result = r;
      });
    }, 200),

    queueTrack(track) {
      api.queue.queueTrack(track.id);
      this.$nextTick(() => {
        this.blurSearch();
      });
    },
  }
}

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

    transition: 0.6s all cubic-bezier(.09,1,.36,1);

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

  background: rgba(0,0,0,0.5);
  z-index: 50;
}
.search-backdrop-enter-active {
  transition: all .5s ease;
}
.search-backdrop-leave-active {
  transition: all .5s ease;
}
.search-backdrop-enter, .search-backdrop-leave-to {
  opacity: 0;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 10px;
  right: 10px;

  margin: 0;
  background: $background-light;
  z-index: 100;
  padding: 0 2em;
  max-height: 80vh;
  overflow-y: auto;

  &__info {
    text-align: center;
    font-size: 1.2em;
    padding: 2em 0;
    color: #666;
  }
}

.search-list {

  &__item {
    display: flex;
    flex-direction: row;

    &__body {
      flex: 1;

      user-select: none;
      cursor: pointer;

      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.8em;
      font-size: 1.2em;
    }

    &__buttons {
      flex-grow: 0;
    }
  }
}


.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>