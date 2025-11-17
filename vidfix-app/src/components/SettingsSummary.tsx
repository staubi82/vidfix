import { Film, Maximize, Headphones } from 'lucide-react'

interface TranscodeSettings {
  codec: 'dnxhr_sq' | 'dnxhr_hq' | 'dnxhr_hqx' | 'h264' | 'prores'
  resolution: 'original' | '1080p' | '720p'
  audio: 'pcm' | 'copy'
  preset: string
  outputToNewDir: boolean
  filenamePattern: 'original' | 'suffix' | 'prefix'
  deleteOriginal: boolean
  shutdownAfter: boolean
}

interface SettingsSummaryProps {
  settings: TranscodeSettings
}

export default function SettingsSummary({ settings }: SettingsSummaryProps) {
  const getCodecLabel = (codec: string) => {
    const labels: Record<string, string> = {
      'dnxhr_sq': 'DNxHR SQ',
      'dnxhr_hq': 'DNxHR HQ',
      'dnxhr_hqx': 'DNxHR HQX',
      'h264': 'H.264',
      'prores': 'ProRes 422'
    }
    return labels[codec] || codec
  }

  const getResolutionLabel = (resolution: string) => {
    const labels: Record<string, string> = {
      'original': 'Original',
      '1080p': 'Max 1080p',
      '720p': 'Max 720p'
    }
    return labels[resolution] || resolution
  }

  const getAudioLabel = (audio: string) => {
    const labels: Record<string, string> = {
      'pcm': 'PCM',
      'copy': 'Original'
    }
    return labels[audio] || audio
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Video Codec */}
      <div className="flex items-center gap-2 h-14">
        <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
          <Film className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xs text-muted-foreground">Zielformat</p>
          <p className="text-sm font-medium">{getCodecLabel(settings.codec)}</p>
        </div>
      </div>

      {/* Resolution */}
      <div className="flex items-center gap-2 h-14">
        <div className="p-2 rounded-lg bg-purple-500/20 flex-shrink-0">
          <Maximize className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xs text-muted-foreground">Auflösung</p>
          <p className="text-sm font-medium">{getResolutionLabel(settings.resolution)}</p>
        </div>
      </div>

      {/* Audio */}
      <div className="flex items-center gap-2 h-14">
        <div className="p-2 rounded-lg bg-green-500/20 flex-shrink-0">
          <Headphones className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xs text-muted-foreground">Audio</p>
          <p className="text-sm font-medium">{getAudioLabel(settings.audio)}</p>
        </div>
      </div>
    </div>
  )
}
