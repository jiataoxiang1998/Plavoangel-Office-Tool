import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readLog: () => ipcRenderer.invoke('log:read'),
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
  getTemplatePath: (template: string) => ipcRenderer.invoke('product:getTemplatePath', template),
  productGen: (params: { product_folder: string; output_dir: string; template_path: string }) => ipcRenderer.invoke('product:generate', params),
  onProductProgress: (callback: (data: { current: number; total: number }) => void) => {
    ipcRenderer.on('product:progress', (_, data) => callback(data))
  },
  removeProductProgressListener: () => {
    ipcRenderer.removeAllListeners('product:progress')
  },
  selectPiFiles: () => ipcRenderer.invoke('pi-to-pl:selectFiles'),
  selectSavePath: () => ipcRenderer.invoke('pi-to-pl:selectSavePath'),
  validateContract: (filePath: string) => ipcRenderer.invoke('pi-to-pl:validateContract', filePath),
  addContract: (filePath: string) => ipcRenderer.invoke('pi-to-pl:addContract', filePath),
  removeContract: (filePath: string) => ipcRenderer.invoke('pi-to-pl:removeContract', filePath),
  getContractArticles: (filePath: string) => ipcRenderer.invoke('pi-to-pl:getContractArticles', filePath),
  generatePackingList: (outputPath: string, selectedArticles: string[]) => ipcRenderer.invoke('pi-to-pl:generatePackingList', outputPath, selectedArticles),
  selectSalesFiles: () => ipcRenderer.invoke('sales-to-production:selectFiles'),
  selectSalesSavePath: () => ipcRenderer.invoke('sales-to-production:selectSavePath'),
  validateSalesContract: (filePath: string) => ipcRenderer.invoke('sales-to-production:validateContract', filePath),
  addSalesContract: (filePath: string) => ipcRenderer.invoke('sales-to-production:addContract', filePath),
  removeSalesContract: (filePath: string) => ipcRenderer.invoke('sales-to-production:removeContract', filePath),
  getSalesContractArticles: (filePath: string) => ipcRenderer.invoke('sales-to-production:getContractArticles', filePath),
  generateProductionOrder: (outputPath: string, selectedArticles: string[]) => ipcRenderer.invoke('sales-to-production:generateProductionOrder', outputPath, selectedArticles)
})