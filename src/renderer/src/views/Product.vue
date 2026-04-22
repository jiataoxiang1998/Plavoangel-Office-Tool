<template>
  <div class="product-container">
    <h2 class="title">产品图片生成</h2>

    <div class="toolbar">
      <button class="btn" @click="onSelectInput" :disabled="store.processing">
        {{ store.inputDir ? '重选输入' : '选择输入' }}
      </button>
      <button class="btn" @click="onSelectOutput" :disabled="!store.inputDir || store.processing">
        {{ store.outputDir ? '重选输出' : '选择输出' }}
      </button>
      <span class="path-hint" v-if="store.inputDir">{{ store.inputDir }}</span>
      <span class="path-hint" v-if="store.outputDir">→ {{ store.outputDir }}</span>
    </div>

    <div class="lists">
      <div class="panel">
        <div class="panel-header">产品列表 ({{ store.folderItems.length }})</div>
        <div class="list" ref="leftList" @scroll="syncScroll($event, 'left')">
          <div
            v-for="item in store.folderItems"
            :key="item.path"
            class="list-item"
            :class="{ done: store.doneNames.includes(item.name), cur: store.currentIndex === item.index }"
          >
            <span class="name">{{ item.name }}</span>
            <span v-if="store.doneNames.includes(item.name)" class="badge done">✓</span>
          </div>
          <div v-if="!store.folderItems.length" class="empty">选择输入文件夹</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">生成结果 ({{ store.resultItems.length }})</div>
        <div class="list" ref="rightList" @scroll="syncScroll($event, 'right')">
          <div
            v-for="(item, idx) in store.resultItems"
            :key="item.path"
            class="list-item result"
            @click="store.setPreview(item.thumbnail)"
          >
            <img v-if="item.thumbnail" :src="item.thumbnail" class="thumb" />
            <span class="name">{{ item.name }}</span>
          </div>
          <div v-for="i in rightPlaceholderCount" :key="'placeholder-' + i" class="list-item placeholder"></div>
          <div v-if="!store.resultItems.length" class="empty">点击开始生成</div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn-outline" @click="onReset" :disabled="store.processing">重置</button>
      <button class="btn-primary" @click="onProcess" :disabled="!canProcess">
        {{ store.processing ? '处理中...' : (store.doneNames.length >= store.folderItems.length && store.folderItems.length > 0 ? '已完成' : '开始生成') }}
      </button>
    </div>

    <div class="progress">
      <div class="bar"><div class="fill" :style="{width: progressPercent+'%'}"></div></div>
      <div class="info">
        <span>{{ store.statusText }}</span>
        <span>{{ store.current }}/{{ store.total }}</span>
      </div>
    </div>
  </div>

  <div class="preview" v-if="store.previewPath" @click="store.setPreview('')">
    <button class="close">×</button>
    <img :src="store.previewPath" @click.stop />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProductStore } from '@/stores/product'

const store = useProductStore()
const leftList = ref<HTMLElement>()
const rightList = ref<HTMLElement>()

const progressPercent = computed(() => store.total ? Math.round(store.current / store.total * 100) : 0)
const canProcess = computed(() => {
  const allDone = store.doneNames.length >= store.folderItems.length && store.folderItems.length > 0
  return !!store.inputDir && !!store.outputDir && store.folderItems.length > 0 && !store.processing && !allDone
})
const rightPlaceholderCount = computed(() => {
  const diff = store.folderItems.length - store.resultItems.length
  return diff > 0 ? diff : 0
})

const syncScroll = (e: Event, from: string) => {
  const el = e.target as HTMLElement
  if (from === 'left' && rightList.value) {
    rightList.value.scrollTop = el.scrollTop
  } else if (from === 'right' && leftList.value) {
    leftList.value.scrollTop = el.scrollTop
  }
}

const onSelectInput = async () => {
  const r = await window.electronAPI.selectDirectory()
  if (r) {
    store.setInputDir(r)
    await loadFolders()
  }
}

const onSelectOutput = async () => {
  const r = await window.electronAPI.selectDirectory()
  if (r) store.setOutputDir(r)
}

const loadFolders = async () => {
  if (!store.inputDir) return
  const fs = await window.electronAPI.listProductFolders(store.inputDir)
  const items = fs.map((name: string, i: number) => ({ index: i, name, path: store.inputDir + '\\' + name }))
  store.setFolderItems(items)
  store.setTotal(items.length)
}

const onProcess = async () => {
  if (!canProcess.value) return
  console.log('onProcess started')
  console.log('inputDir:', store.inputDir)
  console.log('outputDir:', store.outputDir)
  console.log('folderItems:', store.folderItems.length)
  const tpl = await window.electronAPI.getTemplatePath()
  console.log('template:', tpl)
  store.startProcessing()

  let doneCount = store.doneNames.length
  for (let i = 0; i < store.folderItems.length; i++) {
    if (store.doneNames.includes(store.folderItems[i].name)) continue
    const item = store.folderItems[i]
    store.setCurrentIndex(i)
    store.setStatusText(item.name)

    try {
      const r: any = await window.electronAPI.productGen({ product_folder: item.path, output_dir: store.outputDir, template_path: tpl })
      console.log('productGen result:', r)
      if (r.success) {
        const thumb = await loadThumb(r.path)
        console.log('thumbnail:', thumb ? thumb.substring(0, 50) : 'empty')
        store.addResult({ name: item.name, path: r.path, thumbnail: thumb })
        store.addDoneName(item.name)
        doneCount++
        store.setCurrent(doneCount)
      }
    } catch (e) { console.error(e) }
  }

  store.finishProcessing()
}

const loadThumb = async (p: string) => {
  console.log('loadThumb called:', p)
  try {
    const r: any = await window.electronAPI.readFileBase64(p)
    console.log('readFileBase64 result success:', r?.success, 'data length:', r?.data?.length)
    if (r?.success && r?.data) {
      return r.data
    }
    console.log('readFileBase64 failed:', r?.error)
    return ''
  } catch (e) {
    console.error('loadThumb error:', e)
    return ''
  }
}

const onReset = () => { store.reset() }
</script>

<style scoped lang="scss">
.product-container {
  max-width: 800px;
  margin: 0 auto;
}

.title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.path-hint {
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

.btn {
  padding: 6px 12px;
  background: var(--primary);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  &:hover { opacity: 0.9 }
  &:disabled { opacity: 0.4; cursor: not-allowed }
}

.btn-outline {
  @extend .btn;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-primary {
  @extend .btn;
  padding: 8px 24px;
}

.lists {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.panel {
  flex: 1;
  min-width: 0;
}

.panel-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.list {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow-y: auto;
  height: 400px;
  background: var(--bg-card);
}

.list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  height: 36px;
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-primary);
  flex-shrink: 0;

  &:hover { background: var(--bg-hover) }
  &:last-child { border-bottom: none }

  &.done { color: var(--primary); text-decoration: line-through }
  &.cur { background: var(--bg-hover); animation: blink 1s infinite }
  &.result { cursor: pointer }
  &.placeholder { visibility: hidden }
}

@keyframes blink {
  50% { opacity: 0.5 }
}

.thumb {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 3px;
  background: var(--bg-sidebar);
}

.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  font-size: 12px;
  color: var(--primary);
  font-weight: bold;
}

.empty {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.progress {
  padding: 10px 12px;
  background: var(--bg-card);
  border-radius: 6px;
}

.bar {
  height: 6px;
  background: var(--bg-sidebar);
  border-radius: 3px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.2s;
}

.info {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.preview {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  img {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
  }
}

.close {
  position: fixed;
  top: 16px;
  right: 16px;
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  font-size: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10000;
}
</style>