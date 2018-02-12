import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from './components/Home'
import Vote from './components/Vote'
import NotFound from './components/NotFound'

Vue.use(VueRouter)

const routes = [{
	path: '/',
	name: 'home',
	component: Home
}, {
	path: '/vote',
	name: 'vote',
	component: Vote
}, {
	path: '*',
	component: NotFound
}]

export default new VueRouter({
	routes,
	mode: 'history',
})