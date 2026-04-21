<template>
  <div class="rembg-container">
    <h1 class="page-title">图片背景移除</h1>
    
    <div class="upload-section">
      <div class="drop-zone" @click="selectFile" @dragover.prevent @drop="handleDrop">
        <div class="drop-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>拖拽图片到这里，或点击选择</p>
          <p class="hint">支持 PNG、JPG、BMP 格式</p>
        </div>
      </div>
      
      <div class="btn-group">
        <button class="btn" @click="selectFile">选择图片</button>
        <button class="btn" @click="selectFolder">选择文件夹</button>
      </div>
    </div>

    <div class="file-list" v-if="files.length">
      <div class="file-list-header">
        <span>已选择 {{ files.length }} 个文件</span>
        <button class="btn-text" @click="clearFiles">清空</button>
      </div>
      <div class="file-items">
        <div v-for="(f, i) in files" :key="i" class="file-item">
          <button @click="doPreview(i, false)" style="background:none;border:none;padding:0;cursor:pointer;">
            <img :src="thumbnails[f] || ''" class="thumbnail" />
          </button>
          <span class="filename">{{ getBasename(f) }}</span>
        </div>
      </div>
    </div>

    <div class="action-section" v-if="files.length">
      <div class="options-panel">
        <h4>高级参数</h4>
        <div class="options-grid">
          <div class="option-item">
            <input type="checkbox" v-model="alphaMatting" />
            <span>Alpha Matting</span>
            <div class="help-tip" @mouseenter="showTooltip($event)" @mouseleave="hideTooltip">
              <span class="help-icon">?</span>
              <div class="help-content" ref="tooltip1">启用后可获得更干净的边缘，适合头发、毛绒等精细边缘</div>
            </div>
          </div>
          <label class="option-item" v-if="alphaMatting">
            前景阈值
            <div class="help-tip" @mouseenter="showTooltip($event)" @mouseleave="hideTooltip">
              <span class="help-icon">?</span>
              <div class="help-content" ref="tooltip2">决定哪些像素被识别为前景，值越大越激进。推荐 240-270</div>
            </div>
            :
            <input type="number" v-model.number="alphaMattingForegroundThreshold" min="0" max="255" class="option-input" />
          </label>
          <label class="option-item" v-if="alphaMatting">
            背景阈值
            <div class="help-tip" @mouseenter="showTooltip($event)" @mouseleave="hideTooltip">
              <span class="help-icon">?</span>
              <div class="help-content" ref="tooltip3">决定哪些像素被识别为背景，值越小越激进。推荐 10-30</div>
            </div>
            :
            <input type="number" v-model.number="alphaMattingBackgroundThreshold" min="0" max="255" class="option-input" />
          </label>
          <label class="option-item" v-if="alphaMatting">
            侵蚀大小
            <div class="help-tip" @mouseenter="showTooltip($event)" @mouseleave="hideTooltip">
              <span class="help-icon">?</span>
              <div class="help-content" ref="tooltip4">在边缘处向内侵蚀的像素数，可消除边缘杂边。推荐 3-10</div>
            </div>
            :
            <input type="number" v-model.number="alphaMattingErodeSize" min="0" max="50" class="option-input" />
          </label>
          <div class="option-item">
            <input type="checkbox" v-model="postProcessMask" />
            <span>后处理 Mask</span>
            <div class="help-tip" @mouseenter="showTooltip($event)" @mouseleave="hideTooltip">
              <span class="help-icon">?</span>
              <div class="help-content" ref="tooltip5">对生成的mask进行后处理，使边缘更平滑</div>
            </div>
          </div>
          <label class="option-item">
            边缘留白
            <div class="help-tip" @mouseenter="showTooltip($event)" @mouseleave="hideTooltip">
              <span class="help-icon">?</span>
              <div class="help-content" ref="tooltip6">裁剪图片时四周保留的间隙像素，防止边缘被切掉</div>
            </div>
            :
            <input type="number" v-model.number="padding" min="0" max="100" class="option-input" />
            像素
          </label>
        </div>
      </div>
      <button class="btn-primary" @click="processImages" :disabled="processing">
        {{ processing ? '处理中...' : '开始处理' }}
      </button>
    </div>

    <div class="progress-section" v-if="processing">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ progress }}% ({{ current }}/{{ total }})</span>
    </div>

    <div class="result-section" v-if="results.length">
      <h3>处理完成 - {{ results.length }}张</h3>
      <div class="result-items">
        <div v-for="(r, i) in results" :key="i" class="result-item">
          <button @click="doPreview(i, true)" style="background:none;border:none;padding:0;cursor:pointer;">
            <img :src="resultThumbnails[r] || ''" class="thumbnail" />
          </button>
          <span class="filename">{{ getBasename(r) }}</span>
        </div>
      </div>
    </div>

    <div class="preview-modal" v-if="previewUrl" @click="closePreview">
      <button class="preview-close" @click="closePreview">关闭</button>
      <img :src="previewUrl" class="preview-img" @click.stop />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tooltip1 = ref<HTMLElement>()
const tooltip2 = ref<HTMLElement>()
const tooltip3 = ref<HTMLElement>()
const tooltip4 = ref<HTMLElement>()
const tooltip5 = ref<HTMLElement>()
const tooltip6 = ref<HTMLElement>()

const showTooltip = (event: MouseEvent) => {
  const icon = event.target as HTMLElement
  const tip = icon.parentElement?.querySelector('.help-content') as HTMLElement
  if (tip) {
    const rect = icon.getBoundingClientRect()
    const tipWidth = 200
    const tipHeight = 40
    let left = rect.right + 10
    let top = rect.top

    if (left + tipWidth > window.innerWidth) {
      left = rect.left - tipWidth - 10
    }
    if (top + tipHeight > window.innerHeight) {
      top = window.innerHeight - tipHeight - 10
    }
    if (top < 0) {
      top = 10
    }

    tip.style.left = left + 'px'
    tip.style.top = top + 'px'
  }
}

const hideTooltip = () => {}

const previewIndex = ref(-1)
const previewIsResult = ref(false)
const previewUrl = ref('')

const doPreview = (idx: number, isResult: boolean) => {
  previewIndex.value = idx
  previewIsResult.value = isResult
  if (isResult && results.value.length > idx) {
    previewUrl.value = resultThumbnails.value[results.value[idx]] || ''
  } else if (!isResult && files.value.length > idx) {
    previewUrl.value = thumbnails.value[files.value[idx]] || ''
  }
}

const closePreview = () => {
  previewUrl.value = ''
}

const files = ref<string[]>([])
const results = ref<string[]>([])
const processing = ref(false)
const progress = ref(0)
const current = ref(0)
const total = ref(0)
const padding = ref(20)
const alphaMatting = ref(true)
const alphaMattingForegroundThreshold = ref(260)
const alphaMattingBackgroundThreshold = ref(20)
const alphaMattingErodeSize = ref(5)
const postProcessMask = ref(true)
const thumbnails = ref<Record<string, string>>({})
const resultThumbnails = ref<Record<string, string>>({})

const loadThumbnail = async (path: string): Promise<string> => {
  try {
    const result: any = await window.electronAPI.readFileBase64(path)
    if (result && result.success && result.data) {
      return result.data
    }
  } catch (e) {
    console.error('loadThumbnail error:', e)
  }
  return ''
}

const loadAllThumbnails = async () => {
  console.log('Loading thumbnails for', files.value.length, 'files')
  thumbnails.value = {}
  for (let i = 0; i < files.value.length; i++) {
    const f = files.value[i]
    thumbnails.value[f] = await loadThumbnail(f)
    console.log('Loaded', i + 1, '/', files.value.length, '=', thumbnails.value[f] ? 'yes' : 'no')
  }
  console.log('All thumbnails:', Object.keys(thumbnails.value))
}

const selectFile = async () => {
  console.log('selectFile called')
  try {
    const result = await window.electronAPI.openFile({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }],
      properties: ['openFile', 'multiSelections']
    })
    if (result.filePaths && result.filePaths.length > 0) {
      console.log('Files selected:', result.filePaths)
      files.value = result.filePaths
      await loadAllThumbnails()
      console.log('Thumbnails loaded:', Object.keys(thumbnails.value))
    }
  } catch (e) {
    console.error('selectFile error:', e)
  }
}

const selectFolder = async () => {
  const result = await window.electronAPI.openDirectory({})
  if (result.filePaths?.length) {
    const folderPath = result.filePaths[0]
    const imageExts = ['.png', '.jpg', '.jpeg', '.bmp']
    const fs = await window.electronAPI.readDir(folderPath)
    if (fs.success && fs.files) {
      files.value = fs.files
        .filter((f: string) => imageExts.some(ext => f.toLowerCase().endsWith(ext)))
        .map((f: string) => folderPath + '\\' + f)
    }
    await loadAllThumbnails()
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const paths = e.dataTransfer?.files
  if (paths?.length) {
    const imageExts = ['.png', '.jpg', '.jpeg', '.bmp']
    const valid = Array.from(paths).filter(f => 
      imageExts.some(ext => f.name.toLowerCase().endsWith(ext))
    ).map(f => f.path)
    if (valid.length) {
      files.value = valid
    }
  }
}

const clearFiles = () => {
  files.value = []
  results.value = []
}

const processImages = async () => {
  if (!files.value.length) return
  
  processing.value = true
  progress.value = 0
  current.value = 0
  total.value = files.value.length
  results.value = []

  const firstFile = files.value[0]
  const dir = firstFile.substring(0, firstFile.lastIndexOf('\\'))
  const outputDir = dir + '\\rembg_output'

  window.electronAPI.onRembgProgress((data) => {
    current.value = data.current
    total.value = data.total
    progress.value = Math.round((data.current / data.total) * 100)
  })

  try {
    const inputPaths: string[] = files.value.map(f => String(f))
    
    const result = await window.electronAPI.rembgBatch({
      input_paths: inputPaths,
      output_dir: outputDir,
      padding: padding.value,
      alphaMatting: alphaMatting.value,
      alphaMattingForegroundThreshold: alphaMattingForegroundThreshold.value,
      alphaMattingBackgroundThreshold: alphaMattingBackgroundThreshold.value,
      alphaMattingErodeSize: alphaMattingErodeSize.value,
      postProcessMask: postProcessMask.value
    })
    
    if (result.success) {
      results.value = (result.paths || []).map(p => String(p))
      resultThumbnails.value = {}
      for (const r of results.value) {
        const thumb = await loadThumbnail(r)
        resultThumbnails.value[r] = thumb
      }
    } else {
      alert('处理失败: ' + result.error)
    }
  } catch (e) {
    console.error('Process error:', e)
    alert('处理失败: ' + String(e))
  }
  
  processing.value = false
  progress.value = 100
}

const getBasename = (path: string) => {
  return path.split(/[\\/]/).pop() || ''
}
</script>

<style scoped lang="scss">
.rembg-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.upload-section {
  margin-bottom: 20px;
}

.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--primary);
    background: var(--bg-hover);
  }
}

.drop-content {
  color: var(--text-secondary);
  
  svg {
    margin-bottom: 12px;
  }
  
  p {
    margin: 8px 0;
  }
  
  .hint {
    font-size: 12px;
    color: var(--text-secondary);
    opacity: 0.7;
  }
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-main);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: var(--bg-hover);
  }
}

.btn-primary {
  padding: 12px 32px;
  border-radius: 6px;
  border: none;
  background: var(--primary);
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: var(--primary-dark);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}

.file-list {
  margin: 20px 0;
  padding: 16px;
  background: var(--bg-card);
  border-radius: 8px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.file-items, .result-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.file-item, .result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background: var(--bg-main);
  
  &:hover {
    background: var(--bg-hover);
  }
}

.result-item {
  cursor: pointer;
  pointer-events: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 4px;
  background: var(--bg-sidebar);
}

.filename {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
  text-align: center;
  word-break: break-all;
}

.action-section {
  margin: 24px 0;
  text-align: center;
}

.options-panel {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  text-align: left;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-primary);
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  label {
    cursor: pointer;
    user-select: none;
  }
}

.option-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
}

.option-tip {
  font-size: 11px;
  color: var(--text-secondary);
  margin-left: 4px;
}

.help-tip {
  position: static;
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-sidebar);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: help;
  
  &:hover {
    background: var(--primary);
    color: white;
  }
}

.help-content {
  position: fixed;
  padding: 8px 12px;
  background: var(--text-primary);
  color: var(--bg-main);
  font-size: 12px;
  font-weight: normal;
  white-space: normal;
  max-width: 200px;
  border-radius: 4px;
  z-index: 10000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.help-tip:hover .help-content {
  opacity: 1;
}

.progress-section {
  margin: 20px 0;
}

.progress-bar {
  height: 8px;
  background: var(--bg-sidebar);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}

.progress-text {
  display: block;
  text-align: center;
  margin-top: 8px;
  color: var(--text-secondary);
}

.result-section {
  margin-top: 24px;
  
  h3 {
    margin-bottom: 16px;
  }
}

.result-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 12px;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.preview-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
}

.preview-close {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255,255,255,0.3);
  border: 2px solid white;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 4px;
  z-index: 10000;
}
</style>