<template>
  <div id="messages">
    <!-- toasts -->
    <transition-group name="toasts-body" tag="div" class="messages-container">
      <div v-for="toast in toasts"
        class="toasts-body"
        v-bind:class="[toast.type]"
        v-bind:key="toast.id"
        v-on:click="dismissToast()"
        >
        <span v-if="toast.message">{{toast.message}}</span>
        <span v-if="toast.html" v-html="toast.html"></span>
      </div>
    </transition-group>

    <!-- popups -->
    <transition name="popups-backdrop">
      <div v-if="popups.length > 0"
        class="popups-backdrop"
        v-on:click="dismissPopup()"
        >
      </div>
    </transition>
    <transition-group name="popups-body" tag="div" class="messages-container">
      <div v-for="popup in popups"
        class="popups-body"
        v-bind:class="[popup.type]"
        v-bind:key="popup.id"
        v-on:click="dismissPopup()"
        >
        <span v-if="popup.message">{{popup.message}}</span>
        <span v-if="popup.html" v-html="popup.html"></span>
      </div>
    </transition-group>
  </div>

</template>

<script>

import { mapGetters } from "vuex";

export default {
  props: {},

  computed: {
    ...mapGetters({
      toasts: "Messages/toasts",
      popups: "Messages/popups",
    }),
  },

  methods: {
    dismissToast() {
      this.$store.dispatch("Messages/dismissToast");
    },
    dismissPopup() {
      this.$store.dispatch("Messages/dismissPopup");
    },
  },
}

</script>

<style scoped lang="scss">

@import "../assets/variables.scss";

$smooth-transition: cubic-bezier(0.195, 0.945, 0.485, 1);

#messages,
.messages-container {
  pointer-events: none;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* colors / types */
.toasts-body,
.popups-body {
  background: #eee;
  color: #444;

  &.info {
    background: #3f92d2;
    color: white;
  }

  &.alert {
    background: #f35182;
    color: white;
  }

  &.peach {
    background: linear-gradient(to right, transparent, #e8c71f), linear-gradient(to right, rgba(255, 0, 108, 0.3), rgba(228, 38, 71, 0.2)), linear-gradient(to top right, #ec9222, transparent), radial-gradient(closest-corner at 20% 80%, #39866a, #ff08f7);
    background-attachment: fixed;
    color: white;
  }

  &.moss {
    background: linear-gradient(to right, rgba(0,0,0,0), teal), linear-gradient(to right, rgba(255,0,100,.3), rgba(255,100,127,.2)), linear-gradient(to top right, yellow, rgba(0,0,0,0)), radial-gradient(closest-corner at 20% 80%, yellow, red);
    background-attachment: fixed;
    color: white;
  }

  &.deepsea {
    background: linear-gradient(to right, transparent, #1f9eb3), linear-gradient(to right, rgba(183, 63, 175, 0.3), rgba(57, 15, 84, 0.75)), linear-gradient(to top right, #701cbd, transparent), radial-gradient(closest-corner at 20% 80%, #51983f, #263238);
    background-attachment: fixed;
    color: white;
  }

  &.spotify {
    background: #24cf5f;
    color: #292929;
  }
}

/* toasts */
.toasts-body {
  pointer-events: all;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.7em 1em;
  z-index: 1;
  box-shadow: 0 0 20px 0px black;

  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.toasts-body-enter-active,
.toasts-body-leave-active {
  transition: all .5s $smooth-transition;
}
.toasts-body-enter,
.toasts-body-leave-to {
  transform: translate(0, -100%);
}

/* popups */
.popups-backdrop {
  pointer-events: all;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
}

.popups-body {
  pointer-events: all;
  border-radius: 4px;
  min-height: 100px;
  width: 80%;
  max-width: 300px;
  padding: 1em;
  z-index: 1;
  box-shadow: 0 0 20px 0px black;

  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.popups-backdrop-enter-active,
.popups-backdrop-leave-active {
  transition: opacity .8s;
}
.popups-backdrop-enter,
.popups-backdrop-leave-to {
  opacity: 0;
}

.popups-body-enter-active,
.popups-body-leave-active {
  transition: all .5s $smooth-transition;
}
.popups-body-enter {
  transform: translate(0, -100%);
  opacity: 0;
}
.popups-body-leave-to {
  transform: translate(0, 100%);
  opacity: 0;
}

</style>