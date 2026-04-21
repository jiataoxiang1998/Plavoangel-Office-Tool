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
    const data = readFileSync(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() || 'png'
    let mime = 'image/png'
    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg'
    else if (ext === 'bmp') mime = 'image/bmp'
    const base64 = data.toString('base64')
    return { success: true, data: `data:${mime};base64,${base64}` }
  } catch (e) { return { success: false, error: (e as Error).message } }
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

    const pythonExe = join(__dirname, '../../python/python.exe')
    const handlerPy = join(__dirname, '../../python_scripts/rembg_handler.py')

    const results: string[] = []
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
          console.log('Python stdout:', stdout, 'stderr:', stderr, 'code:', code)
          if (code === 0) resolve()
          else reject(new Error(stderr || '处理失败'))
        })
        py.on('error', reject)
      })

      event.sender.send('rembg:progress', { current: i + 1, total: input_paths.length })
      console.log('Completed:', i + 1, '/', input_paths.length)
      results.push(output_path)
    }
    return { success: true, paths: results }
  } catch (e) {
    return { success: false, error: String(e) }
  }
})