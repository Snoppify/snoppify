<template>
  <div id="app">
    <div class="app-body">
      <transition name="router-container">
        <router-view></router-view>
      </transition>
    </div>
    <messages></messages>
  </div>
</template>

<script>
import api from "@/api";

// components
import Messages from "./components/Messages.vue";

export default {
  components: {
    messages: Messages,
  },

  created() {
    if (api.initialized) {
      this.getInfo().then((res) => {
        this.$store.commit("Queue/SET_QUEUE", res.queue);
        this.$store.commit("Queue/SET_CURRENT_TRACK", res.currentTrack);
        this.$store.commit("Queue/SET_BACKUP_PLAYLIST", res.backupPlaylist);
        this.$store.dispatch("Session/GET_WIFI_QR");
      });
    }
  },

  methods: {
    getInfo() {
      return api.misc.info();
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/variables.scss";
@import "@/assets/styles.scss";

div,
span,
button {
  user-select: none;
  outline: none;
}

body {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  position: fixed;
  width: 100%;
  height: 100%;
  background: $background;
  color: $gray;
}

ul {
  padding: 0;
}
li {
  list-style: none;
}

header {
  padding-top: 5px;
  //padding: 5px;
  border-bottom: 1px solid $darkgray;
  background: $background-light;

  .title {
    text-align: center;
    color: $text;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 3px;
    font-style: italic;
    font-weight: bold;
  }
}

h1,
.h1 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-top: 30px;
  margin-bottom: 20px;
}

h1,
h2 {
  text-align: center;
  font-weight: normal;
}

#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  //max-width: 500px;
  margin: auto;
  box-shadow: 0 0 30px 7px black;
}

.app-body {
  flex: 1;
  position: relative;
  height: 100%;

  transform-style: preserve-3d;
}

$page-transition-speed: 0.4s;

.route-container {
  margin: 0 auto;
  width: 100%;
  height: 100%;
  max-width: 500px;
  box-shadow: 0 0 100px 0px rgba(0, 0, 50, 0.3);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: $background;

  transition: all $page-transition-speed cubic-bezier(0.195, 0.945, 0.485, 1);
}

.route-container_overlay {
  z-index: 200;
}

.route-container_overlay.router-container-enter-active,
.route-container_overlay.router-container-leave-active {
  box-shadow: 0 0 100px 0px black;
}
.route-container_overlay.router-container-enter,
.route-container_overlay.router-container-leave-to {
  transform: translate(100%, 0);
  box-shadow: none;
}

button {
  font-size: 1em;
  background: #ddd;
  color: #333;

  margin: 0.1em 0;
  padding: 0.2em 0.5em;

  border: none;
  border-radius: 2px;

  &:active {
    background: #999;
  }
}

.snopp {
  &-vote-btn {
    display: flex;
    align-items: center;
    font-size: 1.2em;
    font-weight: bold;
    background: $background-light;
    border-radius: 4px;
    margin-left: 10px;
    padding: 0 0.7em;
    line-height: 1.4em;
    text-align: center;

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
      background: linear-gradient(hsla(323, 100%, 50%, 1), magenta);
      color: white;

      .arrow-up {
        border-bottom-color: white;
      }
    }
  }
}
</style>
