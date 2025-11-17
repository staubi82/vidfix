import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  browseDirectory: () => ipcRenderer.invoke('browse-directory'),
  listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),
  listDirectory: (dirPath: string, showHidden: boolean = false) => ipcRenderer.invoke('list-directory', dirPath, showHidden),
  getVideoInfo: (filePath: string) => ipcRenderer.invoke('get-video-info', filePath),
  getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
  startTranscode: (options: any) => ipcRenderer.invoke('start-transcode', options),
  pauseTranscode: () => ipcRenderer.invoke('pause-transcode'),
  resumeTranscode: () => ipcRenderer.invoke('resume-transcode'),
  cancelTranscode: () => ipcRenderer.invoke('cancel-transcode'),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  shutdownSystem: () => ipcRenderer.invoke('shutdown-system'),
  onTranscodeProgress: (callback: (data: string) => void) => {
    ipcRenderer.on('transcode-progress', (_, data) => callback(data))
  }
})
