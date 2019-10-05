<template>
  <div id="welcome" class="route-container">
    <img src="@/assets/snopp-logo.png" alt="Snoppify logo" class="logo" />

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

        <div class="start-input">
          <div class="start-input__text">
            <input v-model="hostIP" placeholder="Host IP" />
          </div>
        </div>

        <button class="start-btn start-btn__join" @click="onJoinClick()">Join</button>

        <router-link to="/host" tag="button" class="start-btn start-btn__host">Host</router-link>
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
    showServerForm: false,
    isScanning: false,
    timeSpentScanning: 0,
    foundHost: false,
    hostIP: storage.get("serverIP"),
  }),

  methods: {
    onHostClick() {},
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
  width: 50%;
  display: block;
  margin: 3em auto;
}

.start-btn {
  border: none;
  border-radius: 4px;
  padding: 1em 1.4em;
  font-size: 1.3em;
  font-weight: bold;
  cursor: pointer;
  width: 80%;
  margin-bottom: 1em;

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
</style>
