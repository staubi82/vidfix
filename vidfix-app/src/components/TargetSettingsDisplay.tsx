import { Film, Headphones, FileText, FolderOpen, Power } from 'lucide-react'

interface TranscodeSettings {
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

interface TargetSettingsDisplayProps {
  settings: TranscodeSettings
}

export default function TargetSettingsDisplay({ settings }: TargetSettingsDisplayProps) {
  const getCodecLabel = (codec: string) => {
    const labels: Record<string, string> = {
      'dnxhr_sq': 'DNxHR SQ',
      'dnxhr_hq': 'DNxHR HQ',
      'dnxhr_hqx': 'DNxHR HQX',
      'h264': 'H.264',
      'h265': 'H.265 (HEVC)',
      'prores': 'ProRes 422',
      'vp9': 'VP9',
      'av1': 'AV1'
    }
    return labels[codec] || codec
  }

  const getResolutionLabel = (resolution: string) => {
    const labels: Record<string, string> = {
      '3840x2160': '4K',
      '2560x1440': '1440p',
      '1920x1080': '1080p',
      '1280x720': '720p',
      '854x480': '480p'
    }
    return labels[resolution] || resolution
  }

  const getFpsLabel = (fps: string) => {
    if (fps === 'original') return 'Original'
    return `${fps} fps`
  }

  const getAudioLabel = (audio: string) => {
    const labels: Record<string, string> = {
      'pcm': 'PCM',
      'aac': 'AAC',
      'mp3': 'MP3',
      'flac': 'FLAC',
      'opus': 'Opus',
      'vorbis': 'Vorbis',
      'copy': 'Original'
    }
    return labels[audio] || audio
  }

  const getPatternLabel = (pattern: string) => {
    const labels: Record<string, string> = {
      'original': 'Überschreiben',
      'suffix': 'Suffix',
      'prefix': 'Prefix'
    }
    return labels[pattern] || pattern
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Format */}
      <div className="flex items-center gap-1.5 h-12">
        <div className="p-1.5 rounded-lg bg-blue-500/20 flex-shrink-0">
          <Film className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xs text-muted-foreground">Format</p>
          <p className="text-sm font-medium">{getCodecLabel(settings.codec)}</p>
        </div>
      </div>

      {/* Resolution */}
      <div className="flex items-center gap-1.5 h-12">
        <div className="p-1.5 rounded-lg bg-purple-500/20 flex-shrink-0">
          <Film className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xs text-muted-foreground">Auflösung</p>
          <p className="text-sm font-medium">{getResolutionLabel(settings.resolution)}</p>
        </div>
      </div>

      {/* FPS */}
      <div className="flex items-center gap-1.5 h-12">
        <div className="p-1.5 rounded-lg bg-indigo-500/20 flex-shrink-0">
          <Film className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xs text-muted-foreground">FPS</p>
          <p className="text-sm font-medium">{getFpsLabel(settings.fps)}</p>
        </div>
      </div>

      {/* Audio */}
      <div className="flex items-center gap-1.5 h-12">
        <div className="p-1.5 rounded-lg bg-green-500/20 flex-shrink-0">
          <Headphones className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xs text-muted-foreground">Audio</p>
          <p className="text-sm font-medium">{getAudioLabel(settings.audio)}</p>
        </div>
      </div>

      {/* Mode */}
      <div className="flex items-center gap-1.5 h-12">
        <div className="p-1.5 rounded-lg bg-yellow-500/20 flex-shrink-0">
          <FileText className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xs text-muted-foreground">Modus</p>
          <p className="text-sm font-medium">{getPatternLabel(settings.filenamePattern)}</p>
        </div>
      </div>

      {/* Delete Original */}
      <div className="flex items-center gap-1.5 h-12">
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${settings.deleteOriginal ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
          <FolderOpen className={`w-4 h-4 ${settings.deleteOriginal ? 'text-red-400' : 'text-gray-400'}`} />
        </div>
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Original-Dateien</p>
          <p className={`text-sm font-medium ${settings.deleteOriginal ? 'text-red-400' : ''}`}>
            {settings.deleteOriginal ? 'Werden gelöscht' : 'Werden behalten'}
          </p>
        </div>
      </div>

      {/* Shutdown After */}
      <div className="flex items-center gap-1.5 h-12">
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${settings.shutdownAfter ? 'bg-orange-500/20' : 'bg-gray-500/20'}`}>
          <Power className={`w-4 h-4 ${settings.shutdownAfter ? 'text-orange-400' : 'text-gray-400'}`} />
        </div>
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Nach Abschluss</p>
          <p className={`text-sm font-medium ${settings.shutdownAfter ? 'text-orange-400' : ''}`}>
            {settings.shutdownAfter ? 'PC herunterfahren' : 'Nichts unternehmen'}
          </p>
        </div>
      </div>
    </div>
  )
}
