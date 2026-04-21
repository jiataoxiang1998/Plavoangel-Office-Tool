import { createRouter, createWebHashHistory } from 'vue-router'
import Rembg from '../views/Rembg.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/rembg' },
    { path: '/rembg', component: Rembg }
  ]
})

export default router