<template>
  <div id="new-user" class="route-container">
    <img src="@/assets/snoppify_logo.png" alt="Snoppify logo" class="logo" />
    <!-- <h1>SNOPPIFY</h1> -->
    <!-- <p>sign up, BIIGGHHHCC</p>
	<form v-on:submit.prevent="createUser">
		<input type="text" v-model="username">
		<button>GO!</button>
    </form>-->
    <h1>Sign in with</h1>
    <form v-bind:action="getAuthUrl('google')" class="auth auth--google">
      <input type="hidden" name="partyId" v-bind:value="$route.query.partyId" />
      <input type="submit" value="Google" />
    </form>
    <form v-bind:action="getAuthUrl('facebook')" class="auth auth--facebook">
      <input type="hidden" name="partyId" v-bind:value="$route.query.partyId" />
      <input type="submit" value="Facebook" />
    </form>
    <form v-bind:action="getAuthUrl('spotify')" class="auth auth--spotify">
      <input type="hidden" name="partyId" v-bind:value="$route.query.partyId" />
      <input type="submit" value="Spotify" />
    </form>
  </div>
</template>

<script>
import api from "../api";
import storage from "@/common/device-storage";

export default {
  data: () => ({
    username: "",
    baseURL: "https://" + storage.get("serverIP"),
    authUrls: {
      facebook: "/auth/facebook",
      spotify: "/auth/spotify",
      google: "/auth/google",
    },
  }),

  methods: {
    createUser() {
      api.auth
        .newUser(this.username)
        .then((rep) => {
          this.$store.commit("Session/SET_SESSION", rep);
          this.$router.push("/party");
        })
        .catch((err) => console.log(err));
    },

    getAuthUrl(service) {
      return `${this.baseURL}${this.authUrls[service]}`;
    },
  },

  created() {
    console.log(this.$route.query, this.getAuthUrl("facebook"));
  },

  computed: {},

  mounted: function () {
    this.baseURL = "https://" + storage.get("serverIP");
  },
};
</script>

<style lang="scss">
@import "../assets/variables.scss";

.logo {
  width: 75%;
  display: block;
  margin: 3em auto;
}

.vote-hr {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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

.auth {
  padding: 1em 0 0;
  text-align: center;

  input {
    border: none;
    border-radius: 4px;
    padding: 1em 1.4em;
    font-size: 1.3em;
    font-weight: bold;
    cursor: pointer;
    width: 80%;
  }

  &--facebook input {
    background: #4266b2;
    color: white;
  }

  &--google input {
    background: #ea4335;
    color: white;
  }

  &--spotify {
    margin-bottom: 2em;

    input {
      background: #1db954;
      color: white;
    }
  }
}

#vote {
  background: #cff7ed;
}
</style>
