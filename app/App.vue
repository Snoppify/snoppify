<template>
  <div id="app">
    <div class="app-body">
      <transition name="router-container">
        <router-view></router-view>
      </transition>
    </div>
  </div>
</template>

<script>
import api from "../api";

export default {
  created() {
    this.getInfo().then(res => {
      this.$store.commit("Queue/SET_QUEUE", res.queue);
      this.$store.commit("Queue/SET_CURRENT_TRACK", res.currentTrack);
    });
  },

  methods: {
    getInfo() {
      return api.misc.info();
    }
  }
};
</script>

<style lang="scss">
@import "../assets/variables.scss";

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
  padding: 5px;
  border-bottom: 1px solid $darkgray;
  background: $background-light;

  .title {
    text-align: center;

    color: $text;
  }
}

h1 {
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
}

.app-body {
  flex: 1;
  position: relative;
  height: 100%;

  transform-style: preserve-3d;
}

.route-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 100px 0px rgba(0, 0, 50, 0.3);
  overflow-y: auto;
  background: $background;
}

$page-transition-speed: 0.5s;

.router-container-enter-active {
  transition: all $page-transition-speed cubic-bezier(0.195, 0.945, 0.485, 1);
  transform: translateX(0);
  box-shadow: 0 0 100px 0px rgba(0, 0, 50, 0.3);
}
.router-container-enter {
  transform-origin: 0 0;
  transform: translate(100%, 30%) rotate(-20deg);
  box-shadow: none;
}
.router-container-leave-active {
  transition: all $page-transition-speed;
}
.router-container-leave-to {
}
</style>
