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
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  readFileBase64: (filePath: string) => ipcRenderer.invoke('fs:readFileBase64', filePath),
  generatePackingList: (params: any) => ipcRenderer.invoke('pi-to-pl:generate', params),
  rembgProcess: (params: { input_path: string; output_path: string; padding?: number }) => {
    console.log('rembgProcess called', params)
    return ipcRenderer.invoke('rembg:process', params)
  },
  rembgBatch: (params: {
    input_paths: string[];
    output_dir: string;
    padding?: number;
    alphaMatting?: boolean;
    alphaMattingForegroundThreshold?: number;
    alphaMattingBackgroundThreshold?: number;
    alphaMattingErodeSize?: number;
    postProcessMask?: boolean;
  }) => {
    console.log('rembgBatch called', params)
    return ipcRenderer.invoke('rembg:batch', params)
  },
  onRembgProgress: (callback: (data: { current: number; total: number; path?: string }) => void) => {
    ipcRenderer.on('rembg:progress', (_, data) => callback(data))
  },
  removeRembgProgressListener: () => {
    ipcRenderer.removeAllListeners('rembg:progress')
  },
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  listProductFolders: (inputDir: string) => ipcRenderer.invoke('product:listFolders', inputDir),
  getTemplatePath: () => ipcRenderer.invoke('product:getTemplatePath'),
  productGen: (params: { product_folder: string; output_dir: string; template_path: string }) => ipcRenderer.invoke('product:generate', params),
  onProductProgress: (callback: (data: { current: number; total: number }) => void) => {
    ipcRenderer.on('product:progress', (_, data) => callback(data))
  },
  removeProductProgressListener: () => {
    ipcRenderer.removeAllListeners('product:progress')
  }
})