<template>
  <div class="title-bar" @mousedown="handleMouseDown">
    <div class="title-bar-drag">
      <span class="title-bar-text">Plavoangel</span>
    </div>
    <div class="title-bar-controls">
      <button class="title-btn" @click="minimize" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="2" y="5.5" width="8" height="1" fill="currentColor"/>
        </svg>
      </button>
      <button class="title-btn" @click="maximize" title="最大化">
        <svg v-if="!isMaximized" width="12" height="12" viewBox="0 0 12 12">
          <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12">
          <rect x="3" y="1" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
          <path d="M1 3 L1 9 L7 9 L7 7" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
      </button>
      <button class="title-btn title-btn-close" @click="close" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isMaximized = ref(false)

declare global {
  interface Window {
    electronAPI: {
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}

const minimize = () => {
  window.electronAPI?.minimize()
}

const maximize = () => {
  window.electronAPI?.maximize()
  isMaximized.value = !isMaximized.value
}

const close = () => {
  window.electronAPI?.close()
}

const handleMouseDown = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.title-bar-controls')) {
    return
  }
}
</script>

<style scoped lang="scss">
.title-bar {
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  -webkit-app-region: drag;
  user-select: none;
}

.title-bar-drag {
  flex: 1;
  padding-left: 16px;
  display: flex;
  align-items: center;
}

.title-bar-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-inverse);
}

.title-bar-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.title-btn {
  width: 46px;
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.title-btn-close:hover {
  background: #E81123;
}
</style>