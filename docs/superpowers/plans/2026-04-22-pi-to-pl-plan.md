# 销售合同转装箱单实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现销售合同转装箱单功能，支持添加销售合同、选择货号、生成装箱单 Excel

**Architecture:** 复制原项目 Python handler 到本项目，通过 Electron IPC 调用，主进程执行 Python 脚本后返回结果

**Tech Stack:** Electron + Vue 3 + Python (pandas, openpyxl)

---

### Task 1: 复制 Python 脚本到项目

**Files:**
- Create: `python_scripts/pi_to_pl/__init__.py`
- Create: `python_scripts/pi_to_pl/handler.py`

- [ ] **Step 1: 创建 pi_to_pl 目录和 __init__.py**

```python
# python_scripts/pi_to_pl/__init__.py
```

- [ ] **Step 2: 复制 handler.py**

将 `C:\Users\Administrator\PycharmProjects\Opencode\modules\pi_to_pl\handler.py` 复制到 `python_scripts/pi_to_pl/handler.py`

- [ ] **Step 3: 提交**

```bash
git add python_scripts/pi_to_pl/
git commit -m "feat: 添加销售合同转装箱单 Python 脚本"
```

---

### Task 2: 添加前端路由和基础组件

**Files:**
- Modify: `src/renderer/src/router/index.ts`
- Create: `src/renderer/src/views/PiToPl.vue`

- [ ] **Step 1: 添加路由**

```typescript
import PiToPl from '../views/PiToPl.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/rembg' },
    { path: '/rembg', component: Rembg },
    { path: '/product-image', component: Product },
    { path: '/pi-to-pl', component: PiToPl }
  ]
})
```

- [ ] **Step 2: 创建 PiToPl.vue 基础结构**

参考 Product.vue 创建基础 Vue 组件，包括：
- 标题
- 合同文件列表区域
- 货号列表区域
- 底部按钮和状态栏
- 样式

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/router/index.ts src/renderer/src/views/PiToPl.vue
git commit -m "feat: 添加销售合同转装箱单路由和基础组件"
```

---

### Task 3: 添加前端 IPC 方法

**Files:**
- Modify: `src/preload/index.ts`
- Modify: `src/main/index.ts`

- [ ] **Step 1: 在 preload 添加方法**

```typescript
// 选择文件
ipcRenderer.handle('select-pi-files', async () => {
  const result = await dialog.showOpenFile(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Excel/CSV', extensions: ['xlsx', 'xls', 'csv'] }]
  })
  return result.filePaths
})

// 选择保存路径
ipcRenderer.handle('select-save-path', async () => {
  const result = await dialog.showSaveFile(mainWindow, {
    defaultPath: '装箱单.xlsx',
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  })
  return result.filePath
})

// 验证合同文件
ipcRenderer.handle('validate-contract', async (_, filePath: string) => {
  const handlerPy = path.join(appPath, 'python_scripts', 'pi_to_pl', 'handler.py')
  // 调用 Python 验证
})

// 添加合同
ipcRenderer.handle('add-contract', async (_, filePath: string) => {
  // 调用 Python 添加合同
})

// 生成装箱单
ipcRenderer.handle('generate-packing-list', async (_, outputPath: string, selectedArticles: string[]) => {
  // 调用 Python 生成
})
```

- [ ] **Step 2: 在 renderer 类型定义添加**

```typescript
interface ElectronAPI {
  selectPiFiles(): Promise<string[]>
  selectSavePath(): Promise<string>
  validateContract(filePath: string): Promise<{valid: boolean, message: string}>
  addContract(filePath: string): Promise<{success: boolean, articleNumbers: string[] | string}>
  generatePackingList(outputPath: string, selectedArticles: string[]): Promise<{success: boolean, path?: string, error?: string}>
}
```

- [ ] **Step 3: 提交**

```bash
git add src/preload/index.ts src/main/index.ts
git commit -m "feat: 添加销售合同转装箱单 IPC 方法"
```

---

### Task 4: 实现前端功能逻辑

**Files:**
- Modify: `src/renderer/src/views/PiToPl.vue`

- [ ] **Step 1: 添加合同功能**

```typescript
const contractFiles = ref<string[]>([])
const articleCheckboxes = ref<Record<string, boolean>>({})

const addContracts = async () => {
  const files = await window.electronAPI.selectPiFiles()
  for (const file of files) {
    const result: any = await window.electronAPI.addContract(file)
    if (result.success) {
      contractFiles.value.push(file)
      // 更新货号列表
    }
  }
}
```

- [ ] **Step 2: 货号选择功能**

```typescript
const selectAll = () => {
  Object.keys(articleCheckboxes.value).forEach(k => articleCheckboxes.value[k] = true)
}

const clearAll = () => {
  Object.keys(articleCheckboxes.value).forEach(k => articleCheckboxes.value[k] = false)
}
```

- [ ] **Step 3: 生成装箱单功能**

```typescript
const onGenerate = async () => {
  const selected = Object.entries(articleCheckboxes.value)
    .filter(([_, v]) => v)
    .map(([k]) => k)
  
  const outputPath = await window.electronAPI.selectSavePath()
  if (!outputPath) return
  
  const result: any = await window.electronAPI.generatePackingList(outputPath, selected)
  if (result.success) {
    statusText.value = '生成成功'
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add src/renderer/src/views/PiToPl.vue
git commit -m "feat: 实现销售合同转装箱单前端逻辑"
```

---

### Task 5: 添加状态持久化

**Files:**
- Modify: `src/renderer/src/stores/product.ts`
- Modify: `src/renderer/src/views/PiToPl.vue`

- [ ] **Step 1: 在 store 添加状态**

```typescript
// 添加 PI to PL 相关状态
piToPlContracts: [] as string[],
piToPlArticles: {} as Record<string, boolean>,
piToPlSelectedArticles: [] as string[],
```

- [ ] **Step 2: 添加 onMounted 和 watch**

参考 Rembg.vue 添加状态恢复和保存

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/stores/product.ts src/renderer/src/views/PiToPl.vue
git commit -m "feat: 添加销售合同转装箱单状态持久化"
```

---

### Task 6: 测试和修复

**Files:**
- 测试整体功能

- [ ] **Step 1: 构建并测试**

```bash
npm run build
npm run dev
```

- [ ] **Step 2: 修复发现的问题**

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "fix: 修复销售合同转装箱单问题"
```

---

## 实施方式

计划已完成，有两种执行方式：

1. **Subagent-Driven (推荐)** - 每个任务由独立子代理执行，任务间审查
2. **Inline Execution** - 当前会话中执行任务，带检查点

选择哪种方式？