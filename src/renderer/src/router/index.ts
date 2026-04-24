import { createRouter, createWebHashHistory } from 'vue-router'
import Rembg from '../views/Rembg.vue'
import Product from '../views/Product.vue'
import PiToPl from '../views/PiToPl.vue'
import SalesToProduction from '../views/SalesToProduction.vue'
import Help from '../views/Help.vue'
import Log from '../views/Log.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/rembg' },
    { path: '/rembg', component: Rembg },
    { path: '/product-image', component: Product },
    { path: '/pi-to-pl', component: PiToPl },
    { path: '/sales-to-production', component: SalesToProduction },
    { path: '/help', component: Help },
    { path: '/log', component: Log }
  ]
})

export default router