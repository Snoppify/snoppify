import Vue from "vue";

export default {
    namespaced: true,

    state: {
        toasts: [],
        popups: [],
    },

    getters: {
        toasts: state => state.toasts,
        popups: state => state.popups,
    },

    actions: {
        /**
         * {
         *   type: (string) info, alert, spotify, peach, moss, deepsea
         *   message: (string) Regular text message
         *   html: (string) Message rendered as html
         *   duration: (int) Show duration (default Infinity)
         * }
         */
        toast: (context, data) => {
            context.state.toasts.push(data);
            if (data.duration) {
                setTimeout(() => {
                    context.state.toasts.pop();
                }, data.duration * 1000);
            }
        },

        dismissToast: (context) => {
            context.state.toasts.pop();
        },

        /**
         * {
         *   type: (string) info, alert, spotify, peach, moss, deepsea
         *   message: (string) Regular text message
         *   html: (string) Message rendered as html
         *   duration: (int) Show duration (default Infinity)
         * }
         */
        popup: (context, data) => {
            context.state.popups.push(data);
            if (data.duration) {
                setTimeout(() => {
                    context.state.popups.pop();
                }, data.duration * 1000);
            }
        },

        dismissPopup: (context) => {
            context.state.popups.pop();
        },
    },
}