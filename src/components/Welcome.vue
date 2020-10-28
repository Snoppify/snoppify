<template>
  <div id="welcome" class="route-container">
    <img src="@/assets/snoppify_logo.png" alt="Snoppify logo" class="logo" />

    <div class="container">
      <div v-if="showServerForm && !foundHost">
        <p>Scanning for a host (this may take a while)...</p>
        <p>Has been scanning for: {{ timeSpentScanning }}</p>
      </div>

      <div v-else-if="showServerForm">
        <p>Found a host!</p>
      </div>

      <div v-else>
        <h1>Welcome to Snoppify!</h1>

        <div class="party" v-if="party">
          <div class="party__container">
            <p class="party__info">Ongoing party:</p>
            <div class="party__body">
              <div>
                <p>{{ party.name }}</p>
                <p>({{ party.hostCode }})</p>
              </div>
              <button
                class="party__button"
                v-if="user"
                @click="onJoinPartyClick()"
              >
                Jump in
              </button>
            </div>
          </div>
        </div>

        <div class="start-input">
          <div class="start-input__text">
            <input v-model="hostIP" placeholder="Host IP or SnoppiCode" />
          </div>
        </div>

        <button class="start-btn start-btn__join" @click="onJoinClick()">
          Join
        </button>
        <p>or <a href="/host">host a party</a></p>

        <hr class="welcome-break" />

        <h1>Snoppify your party</h1>
        <p class="welcome-text">
          Snoppify is a party app that connects all members of your party to
          your Spotify player. It is a live playlist with a democratic voting
          system.
        </p>

        <h1>How does it work?</h1>
        <p class="welcome-text">1) Connect to the local WiFi</p>
        <p class="welcome-text">2) Enter the party code or scan the QR-code</p>
        <p class="welcome-text">3) Authenticate with Facebook or Spotify</p>
        <p class="welcome-text">4) Queue tracks and vote for the next song</p>

        <h1>I want to host a party!</h1>
        <p class="welcome-text">
          Get the code from our
          <a href="https://github.com/mold/snoppify">GitHub</a>.
        </p>

        <!-- <router-link to="/host" tag="button" class="start-btn start-btn__host">Host</router-link> -->
      </div>
    </div>
  </div>
</template>

<script>
import getIP from "@/common/get-ip";
import api from "@/api";
import storage from "@/common/device-storage";

import codeWords from "../common/code-words";

export default {
  data: () => ({
    party: null,
    user: null,
    showServerForm: false,
    isScanning: false,
    timeSpentScanning: 0,
    foundHost: false,
    hostIP: storage.get("serverIP"),
  }),

  methods: {
    onHostClick() {},
    onJoinPartyClick() {
      this.$router.push({ name: "home" });
    },
    onJoinClick() {
      if (this.hostIP.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/)) {
        api.init(this.hostIP);
        this.$router.push({ name: "newUser" });

        api.init(this.hostIP);
      } else {
        var ip = codeWords.getIP(this.hostIP);
        if (!ip) {
          console.error("Invalid IP or host code");
          return;
        }

        api.init(ip);
      }

      this.showServerForm = true;

      this.$router.push({ name: "newUser" });

      // this.scanForServers();
    },
    scanForServers() {
      this.isScanning = true;

      const totalStart = Date.now();

      getIP().then(ip => {
        console.log("got ip:", ip);
        var _ip = ip.substr(0, ip.lastIndexOf(".") + 1);

        this.timeSpentScanning = ((Date.now() - totalStart) / 1000).toFixed(1);
        const count = setInterval(() => {
          this.timeSpentScanning = ((Date.now() - totalStart) / 1000).toFixed(
            1,
          );
        }, 191);

        let attempts = 0;
        const port = "3000";
        const controller = new AbortController();

        const onFail = () => {
          attempts++;
          if (attempts === 255) {
            !this.foundHost && alert("no hosts found you suck");
            clearInterval(count);
          }
        };

        const doRequest = index => {
          const _url =
            window.location.protocol +
            "//" +
            _ip +
            index +
            ":" +
            port +
            "/ping";
          let start = Date.now();

          fetch(_url, {
            method: "get",
            signal: controller.signal,
          })
            .then(res => {
              try {
                res.json().then(json => {
                  console.log(json);
                  if (!json.isHost) {
                    return onFail();
                  }

                  attempts++;
                  this.foundHost = true;
                  controller.abort();
                  alert("you are connected my friend");

                  // store sever ip while authing
                  storage.set("serverIP", _ip + index);
                  api.init(_ip + index);

                  this.$router.push({ name: "newUser" });

                  clearInterval(count);
                  clearTimeout(timeout);
                });
              } catch (e) {
                onFail();
              }
            })
            .catch(() => {
              onFail();
            });
        };

        for (let index = 0; index < 256; index++) {
          doRequest(index);
        }

        const timeout = setTimeout(() => {
          controller.abort();
        }, 20000);
      });
    },
  },

  mounted: function() {
    api.auth.auth().then(sessData => {
      this.user = sessData;
    });

    api.misc.info().then(data => {
      this.party = data.party;
    });
  },
};
</script>

<style lang="scss">
@import "../assets/variables.scss";

#welcome {
  padding: 1em 0 0;
  text-align: center;
}

.container {
  margin-bottom: 3em;
  padding: 0 1em;
}

.logo {
  width: 30%;
  display: block;
  margin: 1em auto 2em auto;
}

.party {
  width: 80%;
  margin: 1rem auto;
  border: 1px solid aliceblue;
  border-radius: 0.4em;

  &__container {
    padding: 0.4em 0.8em;
    color: aliceblue;
    text-align: left;
  }

  &__info {
    font-size: 0.7em;
    text-transform: uppercase;
    color: #aaa;
  }

  &__body {
    display: flex;
    justify-content: space-between;
  }

  &__button {
    background: none;
    border: 1px solid aliceblue;
    color: aliceblue;
  }

  p {
    margin: 0.5em 0;
  }
}

.start-btn {
  display: block;
  border: none;
  border-radius: 4px;
  padding: 1em 1.4em;
  font-size: 1.3em;
  font-weight: bold;
  cursor: pointer;
  width: 80%;
  margin: 1rem auto;

  &__join {
    background: #1db954;
    color: white;
  }

  &__host {
    background: none;
    color: #fff;
    border: 1px solid #444;
  }
}

.start-input {
  margin: 0.3em auto;
  width: 80%;

  &__text {
    padding: 0 0.5em;
    background: rgba(255, 255, 255, 0.1);

    input {
      width: 100%;
      padding: 0.5em 0;
      font-size: 1.3em;
      border: none;
      background: none;
      color: white;
    }
  }
}

.welcome-break {
  margin: 5rem auto;
}

.welcome-text {
  font-size: 1em;
  line-height: 1.9em;
  color: orchid;
  width: 90%;
  margin: 0 auto;
}
</style>
