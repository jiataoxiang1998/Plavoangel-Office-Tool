import { defineStore } from 'pinia'

export const useProductStore = defineStore('product', {
  state: () => ({
    inputDir: '',
    outputDir: '',
    folderItems: [] as {index:number,name:string,path:string}[],
    resultItems: [] as {name:string,path:string,thumbnail:string}[],
    doneNames: [] as string[],
    processing: false,
    processed: false,
    locked: false,
    currentIndex: -1,
    statusText: '等待开始',
    current: 0,
    total: 0,
    previewPath: ''
  }),

  getters: {
    isProcessed: (state) => state.processed
  },

  actions: {
    setInputDir(dir: string) { this.inputDir = dir },
    setOutputDir(dir: string) { this.outputDir = dir },
    setFolderItems(items: typeof this.folderItems) { this.folderItems = items },
    addResult(item: typeof this.resultItems[0]) { this.resultItems.push(item) },
    addDoneName(name: string) { this.doneNames.push(name) },
    setProcessing(v: boolean) { this.processing = v },
    setProcessed(v: boolean) { this.processed = v },
    setCurrentIndex(i: number) { this.currentIndex = i },
    setStatusText(s: string) { this.statusText = s },
    setCurrent(v: number) { this.current = v },
    setTotal(v: number) { this.total = v },
    setPreview(p: string) { this.previewPath = p },
    startProcessing() {
      this.processing = true
      this.locked = true
      this.currentIndex = -1
      this.statusText = '处理中...'
    },
    finishProcessing() {
      this.processing = false
      this.setProcessed(true)
      this.locked = false
      this.currentIndex = -1
      this.statusText = `完成 ${this.doneNames.length}/${this.folderItems.length}`
    },
    reset() {
      this.inputDir = ''
      this.outputDir = ''
      this.folderItems = []
      this.resultItems = []
      this.doneNames = []
      this.processing = false
      this.processed = false
      this.locked = false
      this.currentIndex = -1
      this.statusText = '等待开始'
      this.current = 0
      this.total = 0
      this.previewPath = ''
    }
  }
})