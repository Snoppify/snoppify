export default {
	namespaced: true,

	state: {
		io: {},
		isConnected: false,
		storedResult: '',
	},

	getters: {
		connected: state => {
			return state.isConnected;
		},
		result: state => {
			return state.storedResult;
		},
	},

	mutations: {
		SOCKET_CONNECT(state) {
			state.isConnected = true;
		},

		SOCKET_DISCONNECT(state) {
			state.isConnected = false;
		},

		SOCKET_SEARCH(state, message) {
			state.storedResult = JSON.parse(message);
		}
	},

	actions: {
		search(context, query) {
			context.rootState.io.emit("search", query);
		}
	}

}