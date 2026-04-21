import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
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
ipcMain.handle('fs:readFile', async (_, p) => { try { return { success: true, data: readFileSync(p).buffer } } catch (e) { return { success: false, error: (e as Error).message } } })
ipcMain.handle('fs:writeFile', async (_, p, d) => { try { writeFileSync(p, Buffer.from(d)); return { success: true } } catch (e) { return { success: false, error: (e as Error).message } } })