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
export default {};
</script>

<style lang="scss">
body {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  position: fixed;
  width: 100%;
  height: 100%;
}

h1,
h2 {
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
