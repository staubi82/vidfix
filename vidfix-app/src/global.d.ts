export {}

declare global {
  interface Window {
    electronAPI: {
      browseDirectory: () => Promise<string>
      listFiles: (dirPath: string) => Promise<VideoFile[]>
      listDirectory: (dirPath: string, showHidden?: boolean) => Promise<DirectoryItem[]>
      getVideoInfo: (filePath: string) => Promise<any>
      getHomeDir: () => Promise<string>
      startTranscode: (options: TranscodeOptions) => Promise<{ success: boolean }>
      pauseTranscode: () => Promise<{ success: boolean }>
      resumeTranscode: () => Promise<{ success: boolean }>
      cancelTranscode: () => Promise<{ success: boolean }>
      getSystemStats: () => Promise<{ cpu: number; gpu: number; gpuTemp: number; temp: number; ram: number; ramTotal: number; ssdUsed: number; ssdTotal: number }>
      shutdownSystem: () => Promise<{ success: boolean }>
      onTranscodeProgress: (callback: (data: TranscodeProgressData) => void) => void
    }
  }

  interface VideoFile {
    name: string
    path: string
    size: number
    modified: Date
  }

  interface DirectoryItem {
    name: string
    path: string
    isDirectory: boolean
    isHidden: boolean
  }

  interface TranscodeOptions {
    files: string[]
    codec: string
    resolution: string
    fps: string
    audio: string
    audioBitrate: string
    outputDir: string
    outputToNewDir: boolean
    filenamePattern: 'original' | 'suffix' | 'prefix'
    deleteOriginal: boolean
  }

  interface VideoMetadata {
    resolution?: string
    format?: string
    audio?: string
    duration?: string
  }

  interface VideoProgress {
    percentage: number
    currentTime: string
    totalTime: string
    fps: number
  }

  interface TranscodeProgressData {
    filePath: string
    percentage: number
    currentTime: string
    totalTime: string
    fps: number
  }

  interface QueueItem {
    id: string
    videoFile: VideoFile
    metadata?: VideoMetadata
    status: 'waiting' | 'processing' | 'completed' | 'error'
    error?: string
    progress?: VideoProgress
  }
}
