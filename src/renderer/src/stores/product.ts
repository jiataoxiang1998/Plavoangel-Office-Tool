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
    previewPath: '',
    rembgLocked: false,
    rembgFiles: [] as string[],
    rembgResults: [] as string[],
    rembgDoneSet: [] as string[],
    rembgThumbs: {} as Record<string, string>,
    rembgResultThumbs: {} as Record<string, string>,
    rembgProcessing: false,
    rembgCurrent: 0,
    rembgTotal: 0,
    rembgStatusText: '等待开始',
    rembgAlphaMatting: true,
    rembgAlphaMattingForegroundThreshold: 260,
    rembgAlphaMattingBackgroundThreshold: 20,
    rembgAlphaMattingErodeSize: 5,
    rembgPostProcessMask: true,
    rembgPadding: 20
  }),

  getters: {
    isProcessed: (state) => state.processed,
    isRembgLocked: (state) => state.rembgLocked
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
    setRembgLocked(v: boolean) { this.rembgLocked = v },
    startRembg() {
      this.rembgLocked = true
      this.rembgProcessing = true
    },
    finishRembg() {
      this.rembgLocked = false
      this.rembgProcessing = false
    },
    setRembgState(data: {
      files: string[],
      results: string[],
      doneSet: string[],
      thumbs: Record<string, string>,
      resultThumbs: Record<string, string>,
      processing: boolean,
      current: number,
      total: number,
      statusText: string,
      alphaMatting: boolean,
      alphaMattingForegroundThreshold: number,
      alphaMattingBackgroundThreshold: number,
      alphaMattingErodeSize: number,
      postProcessMask: boolean,
      padding: number
    }) {
      this.rembgFiles = data.files
      this.rembgResults = data.results
      this.rembgDoneSet = data.doneSet
      this.rembgThumbs = data.thumbs
      this.rembgResultThumbs = data.resultThumbs
      this.rembgProcessing = data.processing
      this.rembgCurrent = data.current
      this.rembgTotal = data.total
      this.rembgStatusText = data.statusText
      this.rembgAlphaMatting = data.alphaMatting
      this.rembgAlphaMattingForegroundThreshold = data.alphaMattingForegroundThreshold
      this.rembgAlphaMattingBackgroundThreshold = data.alphaMattingBackgroundThreshold
      this.rembgAlphaMattingErodeSize = data.alphaMattingErodeSize
      this.rembgPostProcessMask = data.postProcessMask
      this.rembgPadding = data.padding
      if (data.processing) this.rembgLocked = true
    },
    getRembgState() {
      return {
        files: this.rembgFiles,
        results: this.rembgResults,
        doneSet: this.rembgDoneSet,
        thumbs: this.rembgThumbs,
        resultThumbs: this.rembgResultThumbs,
        processing: this.rembgProcessing,
        current: this.rembgCurrent,
        total: this.rembgTotal,
        statusText: this.rembgStatusText,
        alphaMatting: this.rembgAlphaMatting,
        alphaMattingForegroundThreshold: this.rembgAlphaMattingForegroundThreshold,
        alphaMattingBackgroundThreshold: this.rembgAlphaMattingBackgroundThreshold,
        alphaMattingErodeSize: this.rembgAlphaMattingErodeSize,
        postProcessMask: this.rembgPostProcessMask,
        padding: this.rembgPadding
      }
    },
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