import { createRouter, createWebHashHistory } from 'vue-router'
import Rembg from '../views/Rembg.vue'
import Product from '../views/Product.vue'
import PiToPl from '../views/PiToPl.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/rembg' },
    { path: '/rembg', component: Rembg },
    { path: '/product-image', component: Product },
    { path: '/pi-to-pl', component: PiToPl }
  ]
})

export default router