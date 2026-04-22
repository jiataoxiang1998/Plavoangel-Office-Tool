<template>
  <div class="app-container">
    <TitleBar />
    <div class="main-layout">
      <SideBar />
      <main class="content-area">
        <component :is="currentView" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TitleBar from '@/components/TitleBar.vue'
import SideBar from '@/components/SideBar.vue'
import Product from '@/views/Product.vue'
import Rembg from '@/views/Rembg.vue'

const route = useRoute()
const currentView = computed(() => {
  if (route.path === '/product-image') return Product
  return Rembg
})
</script>

<style scoped lang="scss">
.content-area {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: var(--bg-main);
}
</style>