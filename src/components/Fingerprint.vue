<template>
  <div id="fingerprint" class="route-container">
    <p>Your fingerprint:</p>
    <p>
      <b>{{ fingerprint }}</b>
    </p>
  </div>
</template>

<script>
import Fingerprint2 from "fingerprintjs2";

export default {
  data: () => ({
    fingerprint: "",
  }),

  created() {
    new Fingerprint2().get((res, components) => {
      this.fingerprint = res;
      console.log(components);
    });
  },
};
</script>
