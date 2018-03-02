<template>
  <span class="track-item">
    <router-link :to="{path: '/track/' + track.id}" tag="div" class="track-item__info">
      <span class="artist">
        <span v-for="(artist, index) in track.artists" :key="index">
          <span>{{artist.name}}{{(index+1
            < track.artists.length)? ", ": ""}}</span>
          </span>
        </span>
        -
        <span class="title">
          {{track.name}}
        </span>
        <div class="user" v-if="track.snoppify">
          <div class="user-image" :style="{'background-image':'url('+track.snoppify.issuer.profile+')'}"></div>
          <div>{{track.snoppify.issuer.displayName}}</div>
        </div>
    </router-link>
    <div class="track-item__action-btn" v-if="track.snoppify" v-bind:class="{active:track.snoppify.votes.indexOf(username) != -1}" v-on:click="vote(track)">
      <div class="arrow-up" v-if="track.snoppify.votes.length > 0"></div>
      <div>{{track.snoppify.votes.length}}</div>
    </div>
    </span>
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";

export default {
  props: {
    track: {},
  },

  data() {
    return {};
  },

  computed: {
    ...mapGetters({
      username: "Session/username",
      user: "Session/user",
    }),
  },

  methods: {
    vote(track) {
      if (track.snoppify.issuer.id === this.user.id) {
        alert("du kan inte rösta på din egen låt din dummer!!!");
        return;
      }

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
  },
};
</script>


<style scoped lang="scss">
@import "../assets/variables.scss";

.track-item {
  border-bottom: 1px solid $darkgray;
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
    background: #181818;
    border-radius: 4px;
    margin-right: 10px;
    height: 2em;
    transition-delay: 0.1s;
    background-position: 0 2em;
    transition: background-position 0.3s ease-out;

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
      background-image: linear-gradient(#ff009d, magenta);
      color: white;
      background-position: 0 0em;

      .arrow-up {
        border-bottom-color: white;
      }
    }
  }
}
</style>