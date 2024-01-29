<template>
  <div id="new-user" class="route-container">
    <img src="@/assets/snoppify_logo.png" alt="Snoppify logo" class="logo" />
    <p>ADMIN SIGNUP</p>
    <p>A redirect to the home page means success.</p>
    <form v-on:submit.prevent="createUser">
      <section>
        <label for="username">Username</label>
        <input id="username" type="text" v-model="username" />
      </section>
      <section>
        <label for="password">Password</label>
        <input id="password" type="password" v-model="password" />
      </section>
      <button>SIGNUP</button>
    </form>
  </div>
</template>

<script>
import api from "../api";

export default {
  data: () => ({
    username: "",
    password: "",
    baseURL: process.env.VUE_APP_SERVER_URI,
  }),

  methods: {
    createUser() {
      api.auth
        .signup(this.username, this.password)
        .then(() => {
          this.$router.push("/");
        })
        .catch((err) => console.log(err));
    },
  },
};
</script>

<style lang="scss">
@import "../assets/variables.scss";
</style>
