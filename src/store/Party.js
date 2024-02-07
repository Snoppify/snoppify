export default {
  namespaced: true,

  state: {
    party: null,
  },

  getters: {
    party: (state) => state.party,
  },

  mutations: {
    SET_PARTY: (state, party) => {
      state.party = party;
    },

    SOCKET_INFO: (state, info) => {
      state.party = info.party;
    },
  },

  actions: {},
};
