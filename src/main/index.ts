import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { spawn } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000, height: 700, minWidth: 800, minHeight: 600,
    show: false, frame: false, autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, contextIsolation: true, nodeIntegration: false
    }
  })
  mainWindow.on('ready-to-show', () => mainWindow?.show())
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.officetool.app')
  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize())
ipcMain.on('window-close', () => mainWindow?.close())

ipcMain.handle('dialog:openFile', async (_, o) => dialog.showOpenDialog(mainWindow!, o))
ipcMain.handle('dialog:saveFile', async (_, o) => dialog.showSaveDialog(mainWindow!, o))
ipcMain.handle('dialog:openDirectory', async (_, o) => dialog.showOpenDialog(mainWindow!, { ...o, properties: ['openDirectory'] }))
ipcMain.handle('shell:openPath', async (_, p) => shell.openPath(p))

ipcMain.handle('fs:readFile', async (_, p) => {
  try { return { success: true, data: readFileSync(p).buffer } } 
  catch (e) { return { success: false, error: (e as Error).message } }
})

ipcMain.handle('fs:writeFile', async (_, p, d) => {
  try { writeFileSync(p, Buffer.from(d)); return { success: true } } 
  catch (e) { return { success: false, error: (e as Error).message } }
})

ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
  try {
    const entries = readdirSync(dirPath)
    const files = entries.filter(name => {
      const p = join(dirPath, name)
      return statSync(p).isFile()
    })
    return { success: true, files }
  } catch (e) { return { success: false, error: (e as Error).message } }
})

ipcMain.handle('fs:readFileBase64', async (_, filePath: string) => {
  try {
    console.log('fs:readFileBase64 called:', filePath)
    const data = readFileSync(filePath)
    console.log('fs:readFileBase64 data length:', data.length)
    const ext = filePath.split('.').pop()?.toLowerCase() || 'png'
    let mime = 'image/png'
    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg'
    else if (ext === 'bmp') mime = 'image/bmp'
    const base64 = data.toString('base64')
    const result = `data:${mime};base64,${base64}`
    console.log('fs:readFileBase64 result length:', result.length)
    return { success: true, data: result }
  } catch (e) {
    console.error('fs:readFileBase64 error:', e)
    return { success: false, error: (e as Error).message }
  }
})

ipcMain.handle('rembg:process', async (_, params: { input_path: string; output_path: string }) => {
  try {
    const { input_path, output_path } = params
    process.env.IMGLY_USE_LOCAL_MODELS = 'true'
    const imageBuffer = readFileSync(input_path)
    const removeBackground = (await import('@imgly/background-removal')).default
    const output = await removeBackground(imageBuffer)
    const arrayBuffer = await output.arrayBuffer()
    writeFileSync(output_path, Buffer.from(arrayBuffer))
    return { success: true, path: output_path }
  } catch (e) { return { success: false, error: (e as Error).message } }
})

ipcMain.handle('rembg:batch', async (event, params: {
  input_paths: string[];
  output_dir: string;
  padding?: number;
  alphaMatting?: boolean;
  alphaMattingForegroundThreshold?: number;
  alphaMattingBackgroundThreshold?: number;
  alphaMattingErodeSize?: number;
  postProcessMask?: boolean;
}) => {
  try {
    const {
      input_paths,
      output_dir,
      padding = 20,
      alphaMatting = true,
      alphaMattingForegroundThreshold = 260,
      alphaMattingBackgroundThreshold = 20,
      alphaMattingErodeSize = 5,
      postProcessMask = true
    } = params

    console.log('Output dir:', output_dir)
    console.log('Input paths:', input_paths)
    if (!existsSync(output_dir)) mkdirSync(output_dir, { recursive: true })

    const isDev = process.env.NODE_ENV === 'development' || !process.resourcesPath || process.resourcesPath.includes('electron')
    const pythonDir = isDev ? join(__dirname, '../../python') : join(process.resourcesPath, 'python')
    const scriptsDir = isDev ? join(__dirname, '../../python_scripts') : join(process.resourcesPath, 'python_scripts')
    
    const pythonExe = join(pythonDir, 'python.exe')
    const handlerPy = join(scriptsDir, 'rembg_handler.py')

    console.log('isDev:', isDev)
    console.log('pythonDir:', pythonDir)
    console.log('scriptsDir:', scriptsDir)

    const results: string[] = []
    console.log('Starting batch process for', input_paths.length, 'files')
    console.log('Output dir:', output_dir)
    for (let i = 0; i < input_paths.length; i++) {
      const input_path = input_paths[i]
      const basename = input_path.split(/[\\/]/).pop() || ''
      const nameWithoutExt = basename.replace(/\.[^.]+$/, '')
      const output_path = join(output_dir, nameWithoutExt + '.png')

      const args = [
        handlerPy, '-u', input_path, '-o', output_path,
        '--padding', String(padding),
        '--alpha-matting', alphaMatting ? '1' : '0',
        '--alpha-matting-foreground-threshold', String(alphaMattingForegroundThreshold),
        '--alpha-matting-background-threshold', String(alphaMattingBackgroundThreshold),
        '--alpha-matting-erode-size', String(alphaMattingErodeSize),
        '--post-process-mask', postProcessMask ? '1' : '0'
      ]

      await new Promise<void>((resolve, reject) => {
        const py = spawn(pythonExe, args)
        let stderr = ''
        let stdout = ''
        py.stderr.on('data', (d) => { stderr += d.toString() })
        py.stdout.on('data', (d) => { stdout += d.toString() })
        py.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(stderr || '处理失败'))
        })
        py.on('error', reject)
      })

      event.sender.send('rembg:progress', { current: i + 1, total: input_paths.length, path: output_path })
      console.log('Progress sent:', i + 1, output_path)
      results.push(output_path)
    }
    console.log('Batch process complete, results:', results.length)
    return { success: true, paths: results }
  } catch (e) {
    return { success: false, error: String(e) }
  }
})

ipcMain.handle('dialog:selectDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('product:listFolders', async (_, inputDir: string) => {
  try {
    const entries = readdirSync(inputDir)
    const folders = entries.filter(name => {
      const p = join(inputDir, name)
      return statSync(p).isDirectory()
    })
    return folders
  } catch (e) {
    return []
  }
})

ipcMain.handle('product:getTemplatePath', async () => {
  const isDev = process.env.NODE_ENV === 'development' || !process.resourcesPath || process.resourcesPath.includes('electron')
  if (isDev) {
    return join(__dirname, '../../assets', 'product_template.jpg')
  }
  return join(process.resourcesPath, 'assets', 'product_template.jpg')
})

ipcMain.handle('product:generate', async (event, params: { product_folder: string; output_dir: string; template_path: string }) => {
  try {
    const { product_folder, output_dir, template_path } = params

    console.log('product:generate called')
    console.log('product_folder:', product_folder)
    console.log('output_dir:', output_dir)
    console.log('template_path:', template_path)

    const isDev = process.env.NODE_ENV === 'development' || !process.resourcesPath || process.resourcesPath.includes('electron')
    const pythonDir = isDev ? join(__dirname, '../../python') : join(process.resourcesPath, 'python')
    const scriptsDir = isDev ? join(__dirname, '../../python_scripts') : join(process.resourcesPath, 'python_scripts')

    const pythonExe = join(pythonDir, 'python.exe')
    const handlerPy = join(scriptsDir, 'product_handler.py')

    console.log('isDev:', isDev)
    console.log('pythonExe exists:', existsSync(pythonExe))
    console.log('handlerPy exists:', existsSync(handlerPy))
    console.log('template_path exists:', existsSync(template_path))

    const name = product_folder.split(/[\\/]/).pop() || ''
    const outputPath = join(output_dir, `${name}.jpg`)
    console.log('expected output path:', outputPath)

    if (!existsSync(pythonExe)) {
      return { success: false, error: `Python not found: ${pythonExe}` }
    }
    if (!existsSync(handlerPy)) {
      return { success: false, error: `Handler not found: ${handlerPy}` }
    }
    if (!existsSync(template_path)) {
      return { success: false, error: `Template not found: ${template_path}` }
    }

    const result = await new Promise<{code:number, stdout:string, stderr:string, path:string}>((resolve, reject) => {
      const py = spawn(pythonExe, [handlerPy, '-i', product_folder, '-o', output_dir, '-t', template_path])
      let stderr = ''
      let stdout = ''
      py.stderr.on('data', (d) => { stderr += d.toString() })
      py.stdout.on('data', (d) => { stdout += d.toString() })
      py.on('close', (code) => {
        console.log('Product gen stdout:', stdout)
        console.log('Product gen stderr:', stderr)
        console.log('code:', code)
        const match = stdout.match(/OK:([^\r\n]+)/)
        const pathFromPy = match ? match[1].trim() : outputPath
        console.log('path from python:', pathFromPy)
        resolve({ code: code || 0, stdout, stderr, path: pathFromPy })
      })
      py.on('error', reject)
    })

    if (result.code !== 0) {
      return { success: false, error: result.stderr || '处理失败' }
    }

    console.log('outputPath exists:', existsSync(result.path))
    if (!existsSync(result.path)) {
      console.log('WARNING: output file not found, using fallback')
      return { success: true, path: outputPath }
    }

    console.log('returning path:', result.path)
    return { success: true, path: result.path }
  } catch (e) {
    return { success: false, error: String(e) }
  }
})

const piToPlHandler = {
  contracts: new Map(),
  selectedArticles: new Set() as Set<string>
}

ipcMain.handle('pi-to-pl:selectFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Excel/CSV', extensions: ['xlsx', 'xls', 'csv'] }]
  })
  if (result.canceled) return []
  return result.filePaths
})

ipcMain.handle('pi-to-pl:selectSavePath', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: '装箱单.xlsx',
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  })
  if (result.canceled || !result.filePath) return null
  return result.filePath
})

ipcMain.handle('pi-to-pl:validateContract', async (_, filePath: string) => {
  if (!existsSync(filePath)) return { valid: false, message: '文件不存在' }
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext || '')) return { valid: false, message: '请选择 Excel 或 CSV 文件' }
  return { valid: true, message: '' }
})

ipcMain.handle('pi-to-pl:addContract', async (_, filePath: string) => {
  try {
    const isDev = process.env.NODE_ENV === 'development' || !process.resourcesPath || process.resourcesPath.includes('electron')
    const pythonDir = isDev ? join(__dirname, '../../python') : join(process.resourcesPath, 'python')
    const scriptsDir = isDev ? join(__dirname, '../../python_scripts') : join(process.resourcesPath, 'python_scripts')
    const pythonExe = join(pythonDir, 'python.exe')

    const filePathBase64 = Buffer.from(filePath).toString('base64')

    const result = await new Promise<{code:number, stdout:string, stderr:string, articleNumbers:string[]}>((resolve, reject) => {
      const piToPlDir = join(scriptsDir, 'pi_to_pl')
      const py = spawn(pythonExe, ['-c', `
import sys
import base64
sys.path.insert(0, r'${piToPlDir.replace(/\\/g, '\\\\')}')
from handler import PItoPLHandler
handler = PItoPLHandler()
file_path = base64.b64decode(r'${filePathBase64}').decode('utf-8')
success, result = handler.add_contract(file_path)
if success:
    print('OK:' + ','.join(result))
else:
    print('ERROR:' + str(result))
`])
      let stderr = ''
      let stdout = ''
      py.stderr.on('data', (d) => { stderr += d.toString() })
      py.stdout.on('data', (d) => { stdout += d.toString() })
      py.on('close', (code) => {
        let articleNumbers: string[] = []
        const match = stdout.match(/^OK:(.+)$/m)
        if (match) articleNumbers = match[1].split(',').filter(x => x)
        resolve({ code: code || 0, stdout, stderr, articleNumbers })
      })
      py.on('error', reject)
    })

    if (result.code === 0 && result.articleNumbers.length > 0) {
      piToPlHandler.contracts.set(filePath, { articles: result.articleNumbers })
      result.articleNumbers.forEach(a => piToPlHandler.selectedArticles.add(a))
      return { success: true, articleNumbers: result.articleNumbers }
    }
    return { success: false, error: result.stderr || '添加失败' }
  } catch (e) {
    return { success: false, error: String(e) }
  }
})

ipcMain.handle('pi-to-pl:removeContract', async (_, filePath: string) => {
  if (piToPlHandler.contracts.has(filePath)) {
    const contract = piToPlHandler.contracts.get(filePath)
    if (contract) {
      contract.articles.forEach(a => piToPlHandler.selectedArticles.delete(a))
    }
    piToPlHandler.contracts.delete(filePath)
  }
  return { success: true }
})

ipcMain.handle('pi-to-pl:getContractArticles', async (_, filePath: string) => {
  if (piToPlHandler.contracts.has(filePath)) {
    const contract = piToPlHandler.contracts.get(filePath)
    return { success: true, articleNumbers: contract?.articles || [] }
  }
  return { success: false, articleNumbers: [] }
})

ipcMain.handle('pi-to-pl:generatePackingList', async (_, outputPath: string, selectedArticles: string[]) => {
  try {
    const isDev = process.env.NODE_ENV === 'development' || !process.resourcesPath || process.resourcesPath.includes('electron')
    const pythonDir = isDev ? join(__dirname, '../../python') : join(process.resourcesPath, 'python')
    const scriptsDir = isDev ? join(__dirname, '../../python_scripts') : join(process.resourcesPath, 'python_scripts')
    const pythonExe = join(pythonDir, 'python.exe')
    const outputPathBase64 = Buffer.from(outputPath).toString('base64')
    const articlesJson = Buffer.from(JSON.stringify(selectedArticles)).toString('base64')

    const result = await new Promise<{code:number, stdout:string, stderr:string}>((resolve, reject) => {
      const piToPlDir = join(scriptsDir, 'pi_to_pl')
      const contractPathsJson = Buffer.from(JSON.stringify(Array.from(piToPlHandler.contracts.keys()))).toString('base64')
      const py = spawn(pythonExe, ['-c', `
import sys
import json
import base64
sys.path.insert(0, r'${piToPlDir.replace(/\\/g, '\\\\')}')
from handler import PItoPLHandler
handler = PItoPLHandler()
contract_paths = json.loads(base64.b64decode(r'${contractPathsJson}').decode('utf-8'))
for path in contract_paths:
    handler.add_contract(path)
selected = json.loads(base64.b64decode(r'${articlesJson}').decode('utf-8'))
output_path = base64.b64decode(r'${outputPathBase64}').decode('utf-8')
try:
    result = handler.generate_packing_list(output_path, selected)
    print('OK:' + str(result))
except Exception as e:
    print('ERROR:' + str(e))
`])
      let stderr = ''
      let stdout = ''
      py.stderr.on('data', (d) => { stderr += d.toString() })
      py.stdout.on('data', (d) => { stdout += d.toString() })
      py.on('close', (code) => resolve({ code: code || 0, stdout, stderr }))
      py.on('error', reject)
    })

    if (result.code === 0 && result.stdout.includes('OK:')) {
      return { success: true, path: outputPath }
    }
    return { success: false, error: result.stderr || '生成失败' }
  } catch (e) {
    return { success: false, error: String(e) }
  }
})