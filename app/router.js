import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from './components/Home'
import Vote from './components/Vote'
import NotFound from './components/NotFound'
import {
    store
} from './store'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'home',
    component: Home
}, {
    path: '/vote/:id',
    name: 'vote',
    component: Vote,
    props: true,
}, {
    path: '*',
    component: NotFound
}]

export default new VueRouter({
    routes,
    mode: 'history',
})