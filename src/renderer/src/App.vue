<template>
  <div class="app-container">
    <TitleBar />
    <div class="main-layout">
      <SideBar />
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import TitleBar from '@/components/TitleBar.vue'
import SideBar from '@/components/SideBar.vue'
</script>

<style scoped lang="scss">
.content-area {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: var(--bg-main);
}
</style>