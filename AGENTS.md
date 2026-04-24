# 开发规范 - 日志规范

## 日志函数

使用 `log()` 函数记录日志，自动写入 `app.log` 文件：
- 开发模式：`resources/app.log`
- 生产模式：`{resourcesPath}/app.log`

```typescript
log('message')  // 记录单条消息
log('key:', value)  // 记录键值对
```

## 日志级别规范

### ERROR - 错误
- 操作失败
- 异常捕获
- 资源未找到

```typescript
log('ERROR: operation failed:', error.message)
log('ERROR: Python not found:', pythonExe)
```

### INFO - 信息
- 功能入口/出口
- 关键流程节点
- 配置参数记录

```typescript
log('rembg:batch called, files:', input_paths.length)
log('Python executable:', pythonExe)
log('Starting batch process for', input_paths.length, 'files')
```

### DEBUG - 调试
- 中间状态
- 循环进度
- 详细数据

```typescript
log('Processing file', i + 1, '/', total, ':', basename)
log('Image loaded, size:', img.size, 'mode:', img.mode)
```

## Python 脚本日志

Python 使用 `print()` 输出，Node.js 主进程捕获并写入日志：

```python
print("INFO: Loading model...")
print("DEBUG: Image size:", img.size)
print("ERROR: Model not found at", cache_path)
```

主进程捕获：
```typescript
py.stdout.on('data', (d) => { 
  const msg = d.toString().trim()
  if (msg) log('Python:', msg)
})
```

## 关键模块日志清单

### 背景移除 (rembg:batch)
- ✅ 功能调用：`rembg:batch called, files: N`
- ✅ 环境信息：`isDev`, `pythonDir`, `scriptsDir`
- ✅ 路径检查：Python、Handler 脚本是否存在
- ✅ 循环进度：`Processing file X / N : filename`
- ✅ Python 输出：模型加载、图片处理
- ✅ 结果记录：`Batch process complete, results: N`

### 模型加载 (rembg_handler.py)
- ✅ 版本检查：`rembg version check`
- ✅ 缓存位置：`Default cache base: {path}`
- ✅ 模型加载：`Loading model 'isnet-general-use'`
- ✅ 图片信息：`Image loaded, size: WxH mode: RGB/RGBA`
- ✅ 处理完成：`Background removal complete`

## 日志格式

```
{TIMESTAMP} {LEVEL}: {message}
2026-04-24T10:30:00.000Z INFO: rembg:batch called, files: 9
2026-04-24T10:30:00.100Z INFO: Python executable: C:\...\python.exe
2026-04-24T10:30:00.200Z DEBUG: Python: INFO: Loading model 'isnet-general-use'
2026-04-24T10:30:05.000Z DEBUG: Processing file 1 / 9 : image1.jpg
```

## 禁止事项

- ❌ 静默吞掉错误（`catch {}`）
- ❌ 使用 `console.log` 代替 `log()`
- ❌ 在循环内记录过多无意义日志
- ❌ 记录敏感信息（密码、Token等）