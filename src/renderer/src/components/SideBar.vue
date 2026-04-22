<template>
  <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
    <div class="sidebar-header">
      <div class="sidebar-title" @click="toggleGroup">
        <svg class="collapse-icon" :class="{ rotated: !isGroupCollapsed }" width="14" height="14" viewBox="0 0 14 14">
          <path d="M5 3 L9 7 L5 11" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span v-if="!isSidebarCollapsed" class="title-text">广州办公软件</span>
      </div>
    </div>

    <div class="sidebar-divider" v-if="!isSidebarCollapsed"></div>

    <nav class="sidebar-nav" v-show="!isSidebarCollapsed && !isGroupCollapsed">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: $route.path === item.path, disabled: isLocked && $route.path !== item.path }"
        @click="navigateTo(item.path)"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        <span class="nav-text">{{ item.name }}</span>
      </div>
    </nav>

    <div class="sidebar-footer" v-if="!isSidebarCollapsed">
      <div
        class="nav-item"
        :class="{ active: $route.path === '/help', disabled: isLocked && $route.path !== '/help' }"
        @click="navigateTo('/help')"
      >
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <span class="nav-text">帮助</span>
      </div>
    </div>

    <div class="toggle-wrapper">
      <button class="sidebar-toggle" @click="toggleSidebar" :title="isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path v-if="isSidebarCollapsed" d="M5 3 L10 8 L5 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path v-else d="M11 3 L6 8 L11 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="sidebar-collapsed-view" v-if="isSidebarCollapsed">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="nav-item-collapsed"
        :class="{ active: $route.path === item.path, disabled: isLocked && $route.path !== item.path }"
        :title="item.name"
        @click="navigateTo(item.path)"
      >
        <span class="nav-icon" v-html="item.icon"></span>
      </div>
      <div
        class="nav-item-collapsed"
        :class="{ active: $route.path === '/help', disabled: isLocked && $route.path !== '/help' }"
        title="帮助"
        @click="navigateTo('/help')"
      >
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'

const router = useRouter()
const store = useProductStore()

const isSidebarCollapsed = ref(false)
const isGroupCollapsed = ref(false)

const isLocked = computed(() => store.locked || store.rembgLocked)

const menuItems = [
  {
    name: '销售合同转装箱单',
    path: '/pi-to-pl',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>'
  },
  {
    name: '销售合同转生产单',
    path: '/sales-to-production',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><rect x="8" y="12" width="8" height="6"/></svg>'
  },
  {
    name: '图片背景移除',
    path: '/rembg',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>'
  },
  {
    name: '产品图片生成',
    path: '/product-image',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>'
  }
]

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const toggleGroup = () => {
  isGroupCollapsed.value = !isGroupCollapsed.value
}

const navigateTo = (path: string) => {
  if (store.rembgLocked && path !== '/rembg') {
    return
  }
  if (store.locked && path !== '/product-image') {
    return
  }
  router.push(path)
}
</script>

<style scoped lang="scss">
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  overflow: hidden;
  position: relative;
  z-index: 100;

  &.collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

.sidebar-header {
  padding: 16px;
  user-select: none;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--bg-hover);
  }
}

.title-text {
  white-space: nowrap;
}

.collapse-icon {
  transition: transform var(--transition-fast);
  flex-shrink: 0;
  color: var(--text-secondary);

  &.rotated {
    transform: rotate(90deg);
  }
}

.sidebar-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0 12px;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 12px;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.toggle-wrapper {
  position: absolute;
  bottom: 16px;
  right: 12px;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
}

.sidebar-collapsed-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  margin-bottom: 4px;
  cursor: pointer;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary-light);
    color: var(--primary);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.nav-item-collapsed {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  cursor: pointer;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary-light);
    color: var(--primary);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-text {
  font-size: 14px;
  white-space: nowrap;
}
</style>