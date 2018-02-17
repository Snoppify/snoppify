
<template>
<div id="new-user" class="route-container">
	<h1>SNOPPIFY</h1>
	<p>sign up, BIIGGHHHCC</p>
	<form v-on:submit.prevent="createUser">
		<input type="text" v-model="username">
		<button>GO!</button>
	</form>
</div>
</template>

<script>
import api from "../api";

export default {
  data: () => ({
    username: ""
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
    }
  },

  created() {},

  computed: {}
};
</script>

<style lang="scss">
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

#vote {
  background: #cff7ed;
}
</style>
