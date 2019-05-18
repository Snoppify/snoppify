<template>
  <span class="track-item">
    <router-link
      :to="{ path: '/track/' + track.id }"
      tag="div"
      class="track-item__info"
    >
      <div class="track-item__title">
        <span v-if="index">{{ index }}. </span>{{ track.name }}
      </div>
      <span class="artist">
        <span v-for="(artist, index) in track.artists" :key="index">
          <span
            >{{ artist.name
            }}{{ index + 1 < track.artists.length ? ", " : "" }}</span
          >
        </span>
      </span>
      <div class="track-item__user" v-if="track.snoppify">
        <div
          class="user-image"
          :style="{
            'background-image': 'url(' + track.snoppify.issuer.profile + ')',
          }"
        ></div>
        <div>{{ track.snoppify.issuer.displayName }}</div>
      </div>
    </router-link>
    <span v-if="track.snoppify && track.snoppify.votes">
      <button
        :disabled="track.snoppify.issuer.id == user.id"
        class="snopp-btn snopp-btn--medium snopp-btn--vote"
        v-bind:class="{ active: track.snoppify.votes.indexOf(username) != -1 }"
        v-on:click="vote(track)"
      >
        <div class="arrow-up" v-if="track.snoppify.votes.length > 0"></div>
        <div>{{ track.snoppify.votes.length }}</div>
      </button>
      <!-- <button v-else class="snopp-btn snopp-btn--medium" v-on:click="dequeueTrack(track)">
        Dequeue
      </button> -->
    </span>
    <button
      v-else
      class="snopp-btn snopp-btn--medium"
      v-on:click="queueTrack(track)"
    >
      Queue
    </button>
  </span>
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";
import Vue from "vue";

export default {
  props: {
    track: {},
    index: null,
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

      console.log("vote");

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

    queueTrack(track) {
      Vue.set(track, "snoppify", { issuer: this.user, votes: [] });

      api.queue.queueTrack(track.id).catch(() => {
        track.snoppify = null;
      });
    },

    dequeueTrack(track) {
      api.queue.dequeueTrack(track.id).then(() => {
        track.snoppify = null;
      });
    },
  },
};
</script>

<style scoped lang="scss">
@import "../assets/variables.scss";
@import "../assets/styles.scss";

.track-item {
  border-bottom: 1px solid $darkgray;
  display: flex;
  align-items: center;

  &__info {
    width: 100%;
    padding: 10px 13px;
  }

  &__title {
    color: white;
    font-size: 1.2em;
    margin-bottom: 2px;
  }

  &__user {
    display: flex;
    align-items: center;
    margin-top: 7px;
    color: white;
    font-size: 0.9em;
    height: 22px;
    animation: enter 0.3s ease-out;

    @keyframes enter {
      0% {
        opacity: 0;
        height: 0;
      }

      100% {
        opacity: 1;
        height: 22px;
      }
    }
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
}
</style>
