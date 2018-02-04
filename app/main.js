import 'vueify/lib/insert-css';
import Vue from 'vue'
import App from './App.vue'
import Home from './Home.vue'
import NotFoundComponent from './NotFound.vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [{
	path: '/',
	component: Home
}, {
	path: '*',
	component: NotFoundComponent
}]

const router = new VueRouter({
	routes: routes,
	mode: 'history',
})

new Vue({
	el: '#app',
	data: {
		currentRoute: window.location.pathname
	},
	render: h => h(App),
	router: router,
})