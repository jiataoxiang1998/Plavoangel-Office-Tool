<template>
  <div class="log-container">
    <h2 class="title">日志</h2>

    <div class="log-actions">
      <button class="btn" @click="onRefresh" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
      <button class="btn btn-primary" @click="onDownload" :disabled="loading || !logContent">
        下载日志
      </button>
    </div>

    <div class="log-content" v-if="logContent">
      <pre>{{ logContent }}</pre>
    </div>
    
    <div class="empty" v-else>
      暂无日志内容
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const logContent = ref('')
const loading = ref(false)

const onRefresh = async () => {
  loading.value = true
  try {
    const result = await window.electronAPI.readLog()
    logContent.value = result.success ? (result.content || '') : ''
  } catch (e) {
    logContent.value = ''
  }
  loading.value = false
}

const onDownload = async () => {
  if (!logContent.value) return
  const result = await window.electronAPI.saveFile({
    defaultPath: 'app.log',
    filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
  })
  if (result.canceled || !result.filePath) return
  const encoder = new TextEncoder()
  await window.electronAPI.writeFile(result.filePath, encoder.encode(logContent.value).buffer)
}

onMounted(() => {
  onRefresh()
})
</script>

<style scoped lang="scss">
.log-container {
  max-width: 900px;
  margin: 0 auto;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  text-align: center;
}

.log-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn {
  padding: 8px 16px;
  background: var(--primary);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary);
}

.log-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  max-height: 500px;
  overflow: auto;
  
  pre {
    margin: 0;
    font-size: 12px;
    font-family: 'Consolas', monospace;
    color: var(--text-secondary);
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.empty {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}
</style>