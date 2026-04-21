import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  openFile: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options: Electron.SaveDialogOptions) => ipcRenderer.invoke('dialog:saveFile', options),
  openDirectory: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:openDirectory', options),
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, data: ArrayBuffer) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  generatePackingList: (params: any) => ipcRenderer.invoke('pi-to-pl:generate', params)
})