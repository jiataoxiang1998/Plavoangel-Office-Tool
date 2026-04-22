<template>
  <div class="pitopl-container">
    <h2 class="title">销售合同转装箱单</h2>

    <div class="card">
      <div class="card-header">
        <span class="card-title">销售合同</span>
        <button class="btn" @click="addContracts" :disabled="processing">+ 添加合同</button>
      </div>
      <div class="contract-list">
        <div v-for="(file, index) in contractFiles" :key="file" class="contract-item">
          <span class="contract-name">{{ getFileName(file) }} ({{ articleCounts[file] || 0 }}个货号)</span>
          <button class="btn-remove" @click="removeContract(file)">删除</button>
        </div>
        <div v-if="!contractFiles.length" class="empty">点击添加合同文件</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">客户货号列表</span>
        <div class="header-actions">
          <button class="btn-small" @click="selectAll">全选</button>
          <button class="btn-small" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="article-list">
        <div v-for="article in articles" :key="article" class="article-item">
          <div
            class="checkbox"
            :class="{ checked: selectedArticles.has(article) }"
            @click="toggleArticle(article)"
          ></div>
          <span class="article-name" @click="toggleArticle(article)">{{ article }}</span>
        </div>
        <div v-if="!articles.length" class="empty">添加合同后显示货号</div>
      </div>
    </div>

    <div class="card">
      <div class="output-row">
        <span>保存文件:</span>
        <button class="btn" @click="selectOutput" :disabled="processing">选择</button>
        <span class="path-hint">{{ outputPath || '未选择' }}</span>
      </div>
      <button class="btn-primary" @click="generatePackingList" :disabled="!canGenerate">
        {{ processing ? '生成中...' : '生成装箱单' }}
      </button>
    </div>

    <div class="status">{{ statusText }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProductStore } from '@/stores/product'

const store = useProductStore()

const contractFiles = ref<string[]>([])
const articleCounts = ref<Record<string, number>>({})
const articles = ref<string[]>([])
const selectedArticles = ref<Set<string>>(new Set())
const outputPath = ref('')
const processing = ref(false)
const statusText = ref('')

const canGenerate = computed(() => {
  return contractFiles.value.length > 0 && selectedArticles.value.size > 0 && outputPath.value && !processing.value
})

const getFileName = (path: string) => {
  return path.split(/[\\/]/).pop() || path
}

const addContracts = async () => {
  const files = await window.electronAPI.selectPiFiles()
  for (const file of files) {
    if (contractFiles.value.includes(file)) continue
    
    const result: any = await window.electronAPI.validateContract(file)
    if (!result.valid) {
      statusText.value = `文件无效: ${result.message}`
      continue
    }
    
    const addResult: any = await window.electronAPI.addContract(file)
    if (addResult.success) {
      contractFiles.value.push(file)
      articleCounts.value[file] = addResult.articleNumbers.length
      for (const art of addResult.articleNumbers) {
        if (!articles.value.includes(art)) {
          articles.value.push(art)
          selectedArticles.value.add(art)
        }
      }
      statusText.value = `已添加 ${getFileName(file)}`
    } else {
      statusText.value = `添加失败: ${addResult.error}`
    }
  }
}

const removeContract = async (file: string) => {
  await window.electronAPI.removeContract(file)
  contractFiles.value = contractFiles.value.filter(f => f !== file)
  delete articleCounts.value[file]
  await refreshArticles()
}

const refreshArticles = async () => {
  const allArticles: string[] = []
  for (const file of contractFiles.value) {
    const result: any = await window.electronAPI.getContractArticles(file)
    if (result.success) {
      for (const art of result.articleNumbers) {
        if (!allArticles.includes(art)) {
          allArticles.push(art)
        }
      }
    }
  }
  articles.value = allArticles
}

const toggleArticle = (article: string) => {
  if (selectedArticles.value.has(article)) {
    selectedArticles.value.delete(article)
  } else {
    selectedArticles.value.add(article)
  }
}

const selectAll = () => {
  articles.value.forEach(a => selectedArticles.value.add(a))
}

const clearAll = () => {
  selectedArticles.value.clear()
}

const selectOutput = async () => {
  const path = await window.electronAPI.selectSavePath()
  if (path) outputPath.value = path
}

const generatePackingList = async () => {
  if (!canGenerate.value) return
  
  processing.value = true
  statusText.value = '正在生成...'
  
  const selected = Array.from(selectedArticles.value)
  const result: any = await window.electronAPI.generatePackingList(outputPath.value, selected)
  
  processing.value = false
  
  if (result.success) {
    statusText.value = `生成成功: ${getFileName(result.path)}`
  } else {
    statusText.value = `生成失败: ${result.error}`
  }
}

onMounted(() => {
  const saved = store.getPiToPlState()
  if (saved.contractFiles.length || saved.articles.length) {
    contractFiles.value = saved.contractFiles
    articleCounts.value = saved.articleCounts
    articles.value = saved.articles
    selectedArticles.value = new Set(saved.selectedArticles)
    outputPath.value = saved.outputPath
  }
})

watch([contractFiles, articles, selectedArticles, outputPath], () => {
  store.setPiToPlState({
    contractFiles: contractFiles.value,
    articleCounts: articleCounts.value,
    articles: articles.value,
    selectedArticles: Array.from(selectedArticles.value),
    outputPath: outputPath.value
  })
}, { deep: true })
</script>

<style scoped lang="scss">
.pitopl-container {
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

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
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

.btn-small {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: var(--bg-hover) }
}

.btn-primary {
  @extend .btn;
  width: 100%;
  padding: 10px;
  margin-top: 8px;
}

.btn-remove {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  &:hover { background: #fee; border-color: #f88; color: #c00 }
}

.contract-list {
  background: var(--bg-sidebar);
  border-radius: 6px;
  height: 80px;
  overflow-y: auto;
}

.contract-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  &:last-child { border-bottom: none }
}

.contract-name {
  font-size: 13px;
  color: var(--text-primary);
}

.article-list {
  background: var(--bg-sidebar);
  border-radius: 6px;
  height: 180px;
  overflow-y: auto;
}

.article-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-color);
  &:last-child { border-bottom: none }
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  &.checked {
    background: var(--primary);
    border-color: var(--primary);
    &::after {
      content: '✓';
      color: #fff;
      font-size: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
  }
}

.article-name {
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}

.output-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.path-hint {
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

.empty {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
}

.status {
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 8px;
}
</style>