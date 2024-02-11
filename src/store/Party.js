export default {
  namespaced: true,

  state: {
    party: null,
    snoppiCode: null,
  },

  getters: {
    party: (state) => state.party,
    snoppiCode: (state) => state.snoppiCode,
  },

  mutations: {
    SET_INFO: (state, info) => {
      state.party = info.party;
      state.snoppiCode = info.snoppiCode;
    },

    SOCKET_INFO: (state, info) => {
      state.party = info.party;
      state.snoppiCode = info.snoppiCode;
    },
  },

  actions: {},
};
