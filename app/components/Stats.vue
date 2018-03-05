<template>
  <div id="track" class="route-container route-container_overlay">
    <svg width="500" height="120" rel="chart" id="chart">
      <path id="path1" />
    </svg>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import api from "../api";

export default {

  data() {
    return {
      track: null,
    };
  },

  created() {
    this.$nextTick(() => {
      const d3 = this.$d3;
      var line = d3.line();
var data1 = [[0, 0], [200, 100], [400, 50], [500, 80]];
var data2 = [[0, 100], [100, 50], [220, 80], [250, 0], 
  [300, 20], [350, 30], [400, 100], [420, 10], [430, 90], 
  [500, 40]];

d3.select('#path1')
  .attr('d', line(data1))
  .color("steelblue")
    });
  },

  computed: {
    ...mapGetters({
      user: "Session/user",
      username: "Session/username",
    }),
  },

  methods: {

  },

};
</script>

<style lang="scss">
@import "../assets/variables.scss";

#track {
  // background: $background;
  // color: #444;
}

#chart {
  width: 100%;
}

</style>
