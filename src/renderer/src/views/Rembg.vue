<template>
  <div class="rembg-container">
    <h2 class="title">图片背景移除</h2>

    <div class="toolbar">
      <button class="btn" @click="selectFile" :disabled="processing">选择图片</button>
      <button class="btn" @click="selectFolder" :disabled="processing">选择文件夹</button>
      <span class="path-hint" v-if="files.length">{{ files.length }} 个文件</span>
    </div>

    <div class="lists">
      <div class="panel">
        <div class="panel-header">原始图片 ({{ files.length }})</div>
        <div class="list" ref="leftList" @scroll="syncScroll($event, 'left')">
          <div
            v-for="(f, i) in files"
            :key="f"
            class="list-item"
            :class="{ done: doneSet.has(f), cur: i === current - 1 && processing }"
            @click="onSelectLeftPreview(i)"
          >
            <img v-if="thumbs[f]" :src="thumbs[f]" class="thumb" />
            <span class="name">{{ getBasename(f) }}</span>
            <span v-if="doneSet.has(f)" class="badge done">✓</span>
          </div>
          <div v-if="!files.length" class="empty">选择图片或文件夹</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">处理完成 ({{ results.length }})</div>
        <div class="list" ref="rightList" @scroll="syncScroll($event, 'right')">
          <div
            v-for="(r, i) in results"
            :key="r"
            class="list-item result"
            :class="{ cur: i === results.length - 1 && processing }"
            @click="onSelectRightPreview(i)"
          >
            <img v-if="resultThumbs[r]" :src="resultThumbs[r]" class="thumb" />
            <span class="name">{{ getBasename(r) }}</span>
          </div>
          <div v-for="i in placeholderCount" :key="'placeholder-' + i" class="list-item placeholder"></div>
          <div v-if="!results.length" class="empty">开始处理后显示</div>
        </div>
      </div>
    </div>

    <div class="options">
      <div class="option-row">
        <div class="checkbox" :class="{ checked: alphaMatting }" @click="alphaMatting = !alphaMatting"></div>
        <span class="label">Alpha Matting</span>
        <span class="help" title="启用后可获得更干净的边缘，适合头发、毛绒等精细边缘">?</span>
        <template v-if="alphaMatting">
          <div class="sub-options">
            <span class="label">前景阈值</span>
            <input type="number" v-model.number="alphaMattingForegroundThreshold" class="input" />
            <span class="help" title="决定哪些像素被识别为前景，值越大越激进。推荐 240-270">?</span>
            <span class="label">背景阈值</span>
            <input type="number" v-model.number="alphaMattingBackgroundThreshold" class="input" />
            <span class="help" title="决定哪些像素被识别为背景，值越小越激进。推荐 10-30">?</span>
            <span class="label">侵蚀大小</span>
            <input type="number" v-model.number="alphaMattingErodeSize" class="input" />
            <span class="help" title="在边缘处向内侵蚀的像素数，可消除边缘杂边。推荐 3-10">?</span>
          </div>
        </template>
      </div>
      <div class="option-row">
        <div class="checkbox" :class="{ checked: postProcessMask }" @click="postProcessMask = !postProcessMask"></div>
        <span class="label">后处理 Mask</span>
        <span class="help" title="对生成的mask进行后处理，使边缘更平滑">?</span>
        <span class="label">边缘留白</span>
        <input type="number" v-model.number="padding" class="input" />
        <span class="unit">像素</span>
        <span class="help" title="裁剪图片时四周保留的间隙像素，防止边缘被切掉">?</span>
      </div>
    </div>

    <div class="actions">
      <button class="btn-outline" @click="onReset" :disabled="processing">重置</button>
      <button class="btn-primary" @click="processImages" :disabled="!canProcess || processing">
        {{ processing ? '处理中...' : (results.length >= files.length && files.length > 0 ? '已完成' : '开始处理') }}
      </button>
    </div>

    <div class="progress">
      <div class="bar"><div class="fill" :style="{width: progressPercent+'%'}"></div></div>
      <div class="info">
        <span>{{ statusText }}</span>
        <span>{{ current }}/{{ total }}</span>
      </div>
    </div>
  </div>

  <div class="preview" v-if="previewUrl" @click="closePreview">
    <button class="close" @click="closePreview">×</button>
    <img :src="previewUrl" @click="closePreview" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useProductStore } from '@/stores/product'

const store = useProductStore()

const leftList = ref<HTMLElement>()
const rightList = ref<HTMLElement>()

const files = ref<string[]>([])
const outputDir = ref('')
const results = ref<string[]>([])
const doneSet = ref(new Set<string>())
const thumbs = ref<Record<string, string>>({})
const resultThumbs = ref<Record<string, string>>({})
const processing = ref(false)
const current = ref(0)
const total = ref(0)
const statusText = ref('等待开始')
const previewIndex = ref(-1)
const previewIsResult = ref(false)

const alphaMatting = ref(true)
const alphaMattingForegroundThreshold = ref(260)
const alphaMattingBackgroundThreshold = ref(20)
const alphaMattingErodeSize = ref(5)
const postProcessMask = ref(true)
const padding = ref(20)

onMounted(() => {
  const saved = store.getRembgState()
  if (saved.files.length || saved.results.length || saved.processing) {
    files.value = saved.files
    results.value = saved.results
    doneSet.value = new Set(saved.doneSet)
    thumbs.value = saved.thumbs
    resultThumbs.value = saved.resultThumbs
    processing.value = saved.processing
    current.value = saved.current
    total.value = saved.total
    statusText.value = saved.statusText
    alphaMatting.value = saved.alphaMatting
    alphaMattingForegroundThreshold.value = saved.alphaMattingForegroundThreshold
    alphaMattingBackgroundThreshold.value = saved.alphaMattingBackgroundThreshold
    alphaMattingErodeSize.value = saved.alphaMattingErodeSize
    postProcessMask.value = saved.postProcessMask
    padding.value = saved.padding
  }
})

watch([files, results, doneSet, thumbs, resultThumbs, processing, current, total, statusText, alphaMatting, alphaMattingForegroundThreshold, alphaMattingBackgroundThreshold, alphaMattingErodeSize, postProcessMask, padding], () => {
  store.setRembgState({
    files: files.value,
    results: results.value,
    doneSet: Array.from(doneSet.value),
    thumbs: thumbs.value,
    resultThumbs: resultThumbs.value,
    processing: processing.value,
    current: current.value,
    total: total.value,
    statusText: statusText.value,
    alphaMatting: alphaMatting.value,
    alphaMattingForegroundThreshold: alphaMattingForegroundThreshold.value,
    alphaMattingBackgroundThreshold: alphaMattingBackgroundThreshold.value,
    alphaMattingErodeSize: alphaMattingErodeSize.value,
    postProcessMask: postProcessMask.value,
    padding: padding.value
  })
}, { deep: true })

const previewUrl = computed(() => {
  if (previewIndex.value < 0) return ''
  if (previewIsResult.value && results.value[previewIndex.value]) {
    return resultThumbs.value[results.value[previewIndex.value]] || ''
  }
  if (!previewIsResult.value && files.value[previewIndex.value]) {
    return thumbs.value[files.value[previewIndex.value]] || ''
  }
  return ''
})

const progressPercent = computed(() => total.value ? Math.round(current.value / total.value * 100) : 0)
const canProcess = computed(() => {
  const allDone = results.value.length >= files.value.length && files.value.length > 0
  return !!files.value.length && !processing.value && !allDone
})
const placeholderCount = computed(() => Math.max(0, files.value.length - results.value.length))

const getBasename = (p: string) => p.split(/[\\/]/).pop() || ''

const syncScroll = (e: Event, from: string) => {
  const el = e.target as HTMLElement
  if (from === 'left' && rightList.value) rightList.value.scrollTop = el.scrollTop
  else if (from === 'right' && leftList.value) leftList.value.scrollTop = el.scrollTop
}

const loadThumb = async (p: string) => {
  try {
    const r: any = await window.electronAPI.readFileBase64(p)
    return r?.success ? r.data : ''
  } catch { return '' }
}

const selectFile = async () => {
  const r = await window.electronAPI.openFile({
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }],
    properties: ['openFile', 'multiSelections']
  })
  if (r.filePaths?.length) {
    files.value = r.filePaths
    thumbs.value = {}
    results.value = []
    outputDir.value = ''
    doneSet.value = new Set()
    for (const f of files.value) {
      thumbs.value[f] = await loadThumb(f)
    }
  }
}

const selectFolder = async () => {
  const r = await window.electronAPI.openDirectory({})
  if (r.filePaths?.length) {
    const folder = r.filePaths[0]
    const fs = await window.electronAPI.readDir(folder)
    if (fs.success && fs.files) {
      const exts = ['.png', '.jpg', '.jpeg', '.bmp']
      files.value = fs.files
        .filter((f: string) => exts.some(e => f.toLowerCase().endsWith(e)))
        .map((f: string) => folder + '\\' + f)
      thumbs.value = {}
      results.value = []
      outputDir.value = ''
      doneSet.value = new Set()
      for (const f of files.value) {
        thumbs.value[f] = await loadThumb(f)
      }
    }
  }
}

const selectOutput = async () => {
  const r = await window.electronAPI.selectDirectory()
  if (r) outputDir.value = r
}

const processImages = async () => {
  if (!canProcess.value) return

  const firstFile = files.value[0]
  const dir = firstFile.substring(0, firstFile.lastIndexOf('\\'))
  const outDir = outputDir.value || dir + '\\rembg_output'

  const inputPaths = [...files.value]
  const paddingVal = padding.value
  const alphaMattingVal = alphaMatting.value
  const alphaMattingFgVal = alphaMattingForegroundThreshold.value
  const alphaMattingBgVal = alphaMattingBackgroundThreshold.value
  const alphaMattingErodeVal = alphaMattingErodeSize.value
  const postProcessMaskVal = postProcessMask.value

  processing.value = true
  current.value = 0
  total.value = inputPaths.length
  results.value = []
  doneSet.value = new Set()
  resultThumbs.value = {}
  statusText.value = '处理中...'
  store.startRembg()

  window.electronAPI.removeRembgProgressListener()
  
  const progressHandler = async (data: { current: number; total: number; path?: string }) => {
    console.log('Progress received:', data)
    current.value = data.current
    total.value = data.total
    statusText.value = `处理中: ${data.current}/${data.total}`
    if (data.path) {
      console.log('Adding result:', data.path)
      results.value = [...results.value, data.path]
      setTimeout(async () => {
        const thumb = await loadThumb(data.path!)
        resultThumbs.value = { ...resultThumbs.value, [data.path!]: thumb }
        const origName = getBasename(data.path!)
        doneSet.value = new Set([...doneSet.value, origName])
      }, 10)
    }
  }
  
  window.electronAPI.onRembgProgress(progressHandler)

  try {
    const r: any = await window.electronAPI.rembgBatch({
      input_paths: inputPaths,
      output_dir: outDir,
      padding: paddingVal,
      alphaMatting: alphaMattingVal,
      alphaMattingForegroundThreshold: alphaMattingFgVal,
      alphaMattingBackgroundThreshold: alphaMattingBgVal,
      alphaMattingErodeSize: alphaMattingErodeVal,
      postProcessMask: postProcessMaskVal
    })
    console.log('rembgBatch result:', r)

    if (r.success) {
      results.value = r.paths || []
      for (const p of results.value) {
        resultThumbs.value[p] = await loadThumb(p)
        const origName = getBasename(p)
        const origFile = files.value.find(f => getBasename(f) === origName)
        if (origFile) doneSet.value.add(origFile)
      }
      statusText.value = `完成 ${results.value.length} 个`
    }
  } catch (e) {
    console.error(e)
  }

  processing.value = false
  store.finishRembg()
}

const onReset = () => {
  if (processing.value) return
  window.electronAPI.removeRembgProgressListener()
  files.value = []
  outputDir.value = ''
  results.value = []
  doneSet.value = new Set()
  thumbs.value = {}
  resultThumbs.value = {}
  processing.value = false
  current.value = 0
  total.value = 0
  statusText.value = '等待开始'
  previewIndex.value = -1
  store.finishRembg()
}

const closePreview = () => {
  previewIndex.value = -1
}

const onSelectLeftPreview = (i: number) => {
  if (!processing.value) {
    previewIndex.value = i
    previewIsResult.value = false
  }
}

const onSelectRightPreview = (i: number) => {
  if (!processing.value) {
    previewIndex.value = i
    previewIsResult.value = true
  }
}
</script>

<style scoped lang="scss">
.rembg-container {
  max-width: 900px;
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
  height: 300px;
  background: var(--bg-card);
}

.list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  height: 40px;
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

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sub-options {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid var(--border-color);
}

.checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  background: #fff;

  &.checked {
    background: var(--primary);
    border-color: var(--primary);
    &::after {
      content: '✓';
      display: block;
      color: #fff;
      font-size: 11px;
      text-align: center;
      line-height: 14px;
    }
  }
}

.label {
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}

.help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-sidebar);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: bold;
  cursor: help;

  &:hover {
    background: var(--primary);
    color: white;
  }
}

.input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

.unit {
  font-size: 12px;
  color: var(--text-secondary);
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