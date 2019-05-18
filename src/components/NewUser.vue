<template>
  <div id="new-user" class="route-container">
    <img src="@/assets/snopp-logo.png" alt="Snoppify logo" class="logo" />
    <!-- <h1>SNOPPIFY</h1> -->
    <!-- <p>sign up, BIIGGHHHCC</p>
	<form v-on:submit.prevent="createUser">
		<input type="text" v-model="username">
		<button>GO!</button>
	</form> -->
    <h1>Sign in with</h1>
    <form v-bind:action="authUrls.facebook" class="auth auth--facebook">
      <input type="submit" value="Facebook" />
    </form>
    <form v-bind:action="authUrls.spotify" class="auth auth--spotify">
      <input type="submit" value="Spotify" />
    </form>
  </div>
</template>

<script>
import api from "../api";

console.log(api);

export default {
  data: () => ({
    username: "",
    authUrls: {
      facebook: api.axios.defaults.baseURL + "/auth/facebook",
      spotify: api.axios.defaults.baseURL + "/auth/spotify",
    },
  }),

  methods: {
    createUser() {
      api.auth
        .newUser(this.username)
        .then(rep => {
          this.$store.commit("Session/SET_SESSION", rep);
          this.$router.push("/");
        })
        .catch(err => console.log(err));
    },
  },

  created() {},

  computed: {},
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
