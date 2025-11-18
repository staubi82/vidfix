import { useState, useEffect, useRef } from 'react'
import { Folder, Play, Pause, X, Settings as SettingsIcon, Video, Cpu, HardDrive } from 'lucide-react'
import FileBrowser from './components/FileBrowser'
import DirectoryModal from './components/DirectoryModal'
import { TranscodeQueue } from './components/TranscodeQueue'
import Settings from './components/Settings'
import ProgressBar from './components/ProgressBar'
import TargetSettingsDisplay from './components/TargetSettingsDisplay'
import ProfileSelector from './components/ProfileSelector'
import { getProfileById } from './constants/profiles'

export interface TranscodeSettings {
  codec: 'dnxhr_sq' | 'dnxhr_hq' | 'dnxhr_hqx' | 'h264' | 'h265' | 'prores' | 'vp9' | 'av1'
  resolution: '3840x2160' | '2560x1440' | '1920x1080' | '1280x720' | '854x480'
  fps: 'original' | '24' | '25' | '30' | '50' | '60' | '120'
  audio: 'pcm' | 'aac' | 'mp3' | 'flac' | 'opus' | 'vorbis' | 'copy'
  audioBitrate: string
  preset: string
  outputToNewDir: boolean
  filenamePattern: 'original' | 'suffix' | 'prefix'
  deleteOriginal: boolean
  shutdownAfter: boolean
}

function App() {
  const [currentDir, setCurrentDir] = useState<string>('')
  const [browserDir, setBrowserDir] = useState<string>('')
  const [homeDir, setHomeDir] = useState<string>('')
  const [files, setFiles] = useState<VideoFile[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [, setCurrentProcessingIndex] = useState<number>(0)
  const [metadataCache, setMetadataCache] = useState<Record<string, VideoMetadata>>({})
  const [isTranscoding, setIsTranscoding] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState('')
  const cancelRequestedRef = useRef(false)
  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [settings, setSettings] = useState<TranscodeSettings>({
    codec: 'dnxhr_sq',
    resolution: '1920x1080',
    fps: '30',
    audio: 'pcm',
    audioBitrate: '192k',
    preset: 'DJI Standard',
    outputToNewDir: true,
    filenamePattern: 'suffix',
    deleteOriginal: false,
    shutdownAfter: false
  })
  const [selectedProfile, setSelectedProfile] = useState<string>('custom')

  useEffect(() => {
    window.electronAPI.onTranscodeProgress((data: TranscodeProgressData) => {
      // Update the queue item with progress data
      setQueue(prev => prev.map(item =>
        item.videoFile.path === data.filePath
          ? {
              ...item,
              progress: {
                percentage: data.percentage,
                currentTime: data.currentTime,
                totalTime: data.totalTime,
                fps: data.fps
              }
            }
          : item
      ))

      // Also update the global progress string for ProgressBar (optional)
      setProgress(`${data.percentage}% | ${data.currentTime}/${data.totalTime} | ${data.fps} fps`)
    })

    // Load home directory from main process
    window.electronAPI.getHomeDir().then((dir) => {
      setHomeDir(dir)
      setBrowserDir(dir)
    })
  }, [])

  const handleOpenDirectoryModal = () => {
    setShowDirectoryModal(true)
  }

  const handleDirectoryChange = (path: string) => {
    setBrowserDir(path)
  }

  const handleSelectDirectory = async (path: string) => {
    setCurrentDir(path)
    const fileList = await window.electronAPI.listFiles(path)
    setFiles(fileList)
  }

  const handleCloseDirectoryModal = () => {
    setShowDirectoryModal(false)
  }

  const handleFileSelect = (file: VideoFile) => {
    // Prüfe ob Datei bereits in Queue
    const existingIndex = queue.findIndex(item => item.videoFile.path === file.path)

    if (existingIndex >= 0) {
      // Entferne aus Queue
      setQueue(queue.filter((_, i) => i !== existingIndex))
    } else {
      // Füge zur Queue hinzu
      const newQueueItem: QueueItem = {
        id: `${file.path}-${Date.now()}`,
        videoFile: file,
        status: 'waiting'
      }
      setQueue([...queue, newQueueItem])
    }
  }

  const handleRemoveItem = (id: string) => {
    setQueue(queue.filter(item => item.id !== id))
  }

  const handleClearAll = () => {
    setQueue([])
  }

  const handleReorderQueue = (newQueue: QueueItem[]) => {
    setQueue(newQueue)
  }

  const handleSelectAllFiles = (filesToSelect: VideoFile[]) => {
    const existingPaths = new Set(queue.map(item => item.videoFile.path))
    const newItems: QueueItem[] = filesToSelect
      .filter(file => !existingPaths.has(file.path))
      .map(file => ({
        id: `${file.path}-${Date.now()}`,
        videoFile: file,
        status: 'waiting' as const
      }))
    setQueue([...queue, ...newItems])
  }

  const handleSelectNone = () => {
    setQueue([])
  }

  const handleLoadMetadata = async (queueItemId: string, filePath: string) => {
    // Prüfe ob bereits im Cache
    if (metadataCache[queueItemId]) {
      return
    }

    try {
      const info = await window.electronAPI.getVideoInfo(filePath)
      const videoStream = info?.streams?.find((s: any) => s.codec_type === 'video')
      const audioStream = info?.streams?.find((s: any) => s.codec_type === 'audio')

      const metadata: VideoMetadata = {
        resolution: videoStream?.width ? `${videoStream.width}x${videoStream.height}` : 'Unbekannt',
        format: videoStream?.codec_name ? videoStream.codec_name.toUpperCase() : 'Unbekannt',
        audio: audioStream?.codec_name ? audioStream.codec_name.toUpperCase() : 'Keine Audio',
        duration: info?.format?.duration ? `${Math.round(parseFloat(info.format.duration))}s` : 'Unbekannt'
      }

      setMetadataCache(prev => ({
        ...prev,
        [queueItemId]: metadata
      }))

      // Update Queue Item mit Metadaten
      setQueue(prev =>
        prev.map(item =>
          item.id === queueItemId ? { ...item, metadata } : item
        )
      )
    } catch (error) {
      console.error('Fehler beim Laden der Metadaten:', error)
    }
  }

  const handleStartTranscode = async () => {
    if (queue.length === 0) return

    setIsTranscoding(true)
    setIsPaused(false)
    setCurrentProcessingIndex(0)
    cancelRequestedRef.current = false

    // Kopiere Queue am Anfang um Index-Probleme zu vermeiden
    const queueToProcess = [...queue]

    // Auto-detect parallele Jobs basierend auf verfügbaren CPU-Kernen
    // Da jedes Video bereits alle Kerne nutzt (-threads 0), nur 2-3 parallele Jobs
    const cpuCores = navigator.hardwareConcurrency || 4
    const parallelJobs = Math.max(2, Math.min(Math.ceil(cpuCores / 4), 3))

    // Verarbeite Videos in Batches (parallel)
    for (let i = 0; i < queueToProcess.length; i += parallelJobs) {
      if (cancelRequestedRef.current) break

      // Erstelle Batch mit bis zu parallelJobs Videos
      const batch = queueToProcess.slice(i, i + parallelJobs)

      // Starte alle Videos im Batch parallel
      const batchPromises = batch.map(async (item) => {
        const itemId = item.id

        // Update Status zu 'processing'
        setQueue(prev =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: 'processing' } : q
          )
        )

        try {
          const result = await window.electronAPI.startTranscode({
            files: [item.videoFile.path],
            codec: settings.codec,
            resolution: settings.resolution,
            fps: settings.fps,
            audio: settings.audio,
            audioBitrate: settings.audioBitrate,
            outputDir: currentDir,
            outputToNewDir: settings.outputToNewDir,
            filenamePattern: settings.filenamePattern,
            deleteOriginal: settings.deleteOriginal
          })

          // Update Status basierend auf Erfolg
          if (result.success) {
            setQueue(prev =>
              prev.map((q) =>
                q.id === itemId ? { ...q, status: 'completed' } : q
              )
            )
          } else {
            setQueue(prev =>
              prev.map((q) =>
                q.id === itemId ? { ...q, status: 'error', error: 'Transcode fehlgeschlagen' } : q
              )
            )
          }
        } catch (error) {
          setQueue(prev =>
            prev.map((q) =>
              q.id === itemId ? { ...q, status: 'error', error: String(error) } : q
            )
          )
        }
      })

      // Warte bis alle Videos im Batch fertig sind
      await Promise.all(batchPromises)

      setCurrentProcessingIndex(i + batch.length)
    }

    setIsTranscoding(false)
    setIsPaused(false)
    cancelRequestedRef.current = false

    // Herunterfahren wenn Option aktiviert
    if (settings.shutdownAfter && !cancelRequestedRef.current) {
      await window.electronAPI.shutdownSystem()
    }
  }

  const handlePauseResume = async () => {
    if (isPaused) {
      await window.electronAPI.resumeTranscode()
      setIsPaused(false)
    } else {
      await window.electronAPI.pauseTranscode()
      setIsPaused(true)
    }
  }

  const handleCancel = async () => {
    cancelRequestedRef.current = true
    await window.electronAPI.cancelTranscode()
    setIsTranscoding(false)
    setIsPaused(false)
  }

  const handleProfileChange = (profileId: string) => {
    const profile = getProfileById(profileId)
    if (profile) {
      setSettings(profile.settings)
      setSelectedProfile(profileId)
    }
  }

  const handleSettingsChange = (newSettings: TranscodeSettings) => {
    setSettings(newSettings)
    // Wenn Settings manuell geändert werden, wechsle zu "Eigene Einstellungen"
    setSelectedProfile('custom')
  }

  const selectedCount = queue.length
  const totalSize = queue.reduce((sum, item) => sum + item.videoFile.size, 0)
  const queuedPaths = new Set(queue.map(item => item.videoFile.path))

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="h-14 bg-card border-b border-border flex items-center justify-between pl-6 pr-32 drag-region">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            VidFix Pro
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Browser */}
        <div className="w-80 border-r border-border flex flex-col bg-card/50">
          <div className="p-4 border-b border-border space-y-2">
            <button
              onClick={handleOpenDirectoryModal}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              <Folder className="w-4 h-4" />
              Ordner wählen
            </button>
          </div>

          <FileBrowser
            files={files}
            selectedFiles={new Set()}
            selectedFile={null}
            onFileSelect={handleFileSelect}
            currentDir={currentDir}
            queuedPaths={queuedPaths}
            onSelectAll={handleSelectAllFiles}
            onSelectNone={handleSelectNone}
          />

          {/* Selection Info */}
          <div className="pt-[20px] pb-4 px-4 border-t border-border bg-card/80">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ausgewählt:</span>
                <span className="font-medium">{selectedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Größe:</span>
                <span className="font-medium">{(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel - Transcode Queue */}
        <div className="flex-1 flex flex-col">
          {/* Target Settings - Always visible */}
          <div className="px-6 pt-4 pb-[12px] border-b border-border">
            <TargetSettingsDisplay settings={settings} outputDir={currentDir} />
          </div>

          <div className="flex-1 overflow-hidden px-6 py-4">
            <TranscodeQueue
              queue={queue}
              onRemoveItem={handleRemoveItem}
              onLoadMetadata={handleLoadMetadata}
              onClearAll={handleClearAll}
              onReorderQueue={handleReorderQueue}
            />
          </div>

          {/* Progress Section - Always visible */}
          <div className="border-t border-border bg-card/50">
            <ProgressBar progress={progress} isTranscoding={isTranscoding} />
          </div>
        </div>

        {/* Right Panel - Settings */}
        <div className="w-96 border-l border-border bg-card/50 flex flex-col">
          <div className="pt-[32px] pb-4 px-4 border-b border-border">
            <h2 className="flex items-center gap-2 font-semibold text-lg">
              <SettingsIcon className="w-5 h-5 text-primary" />
              Einstellungen
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <ProfileSelector
              selectedProfileId={selectedProfile}
              onProfileChange={handleProfileChange}
            />

            <Settings
              settings={settings}
              onSettingsChange={handleSettingsChange}
              selectedProfile={selectedProfile}
            />
          </div>

          {/* Control Buttons */}
          <div className="p-4 border-t border-border mt-auto space-y-2">
            {!isTranscoding ? (
              <button
                onClick={handleStartTranscode}
                disabled={selectedCount === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/20"
              >
                <Play className="w-5 h-5" />
                Transcoding starten
              </button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePauseResume}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4" />
                        Fortsetzen
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Abbrechen
                  </button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {isPaused ? 'Pausiert' : 'Wird verarbeitet...'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-card border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>VidFix Pro by Staubi V1.0.0</span>
          {currentDir && (
            <span className="flex items-center gap-1">
              <Folder className="w-3 h-3" />
              {currentDir}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            CPU Mode
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {files.length} Videos
          </span>
        </div>
      </div>

      {/* Directory Modal */}
      <DirectoryModal
        isOpen={showDirectoryModal}
        browserDir={browserDir}
        homeDir={homeDir}
        onDirectoryChange={handleDirectoryChange}
        onSelect={handleSelectDirectory}
        onClose={handleCloseDirectoryModal}
      />
    </div>
  )
}

export default App
