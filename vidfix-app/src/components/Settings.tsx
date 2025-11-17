import { useState } from 'react'
import { Film, Maximize, Headphones, ChevronDown, FolderOutput, FileText, Trash2, Power } from 'lucide-react'

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

interface SettingsProps {
  settings: TranscodeSettings
  onSettingsChange: (settings: TranscodeSettings) => void
}

export default function Settings({ settings, onSettingsChange }: SettingsProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const codecOptions = [
    { value: 'dnxhr_sq', label: 'DNxHR SQ', desc: 'Standard Quality (empfohlen für DaVinci)' },
    { value: 'dnxhr_hq', label: 'DNxHR HQ', desc: 'High Quality (größere Dateien)' },
    { value: 'dnxhr_hqx', label: 'DNxHR HQX', desc: '10-bit High Quality (beste Qualität)' },
    { value: 'prores', label: 'ProRes 422', desc: 'Apple Standard' },
    { value: 'h264', label: 'H.264', desc: 'Kompakt (MPEG-4 Baseline)' },
    { value: 'h265', label: 'H.265 (HEVC)', desc: 'Moderne Kompression (50% kleiner)' },
    { value: 'vp9', label: 'VP9', desc: 'Google Video Codec (lizenzfrei)' },
    { value: 'av1', label: 'AV1', desc: 'Beste Kompression (langsam)' }
  ]

  const resolutionOptions = [
    { value: '3840x2160', label: '4K (3840×2160)', desc: 'Ultra HD' },
    { value: '2560x1440', label: '1440p (2560×1440)', desc: 'QHD' },
    { value: '1920x1080', label: '1080p (1920×1080)', desc: 'Full HD' },
    { value: '1280x720', label: '720p (1280×720)', desc: 'HD' },
    { value: '854x480', label: '480p (854×480)', desc: 'SD' }
  ]

  const fpsOptions = [
    { value: 'original', label: 'Original', desc: 'Keine Änderung' },
    { value: '24', label: '24 fps', desc: 'Kino Standard' },
    { value: '25', label: '25 fps', desc: 'PAL Standard' },
    { value: '30', label: '30 fps', desc: 'NTSC Standard' },
    { value: '50', label: '50 fps', desc: 'PAL HD' },
    { value: '60', label: '60 fps', desc: 'NTSC HD' },
    { value: '120', label: '120 fps', desc: 'High Speed' }
  ]

  const audioOptions = [
    { value: 'pcm', label: 'PCM (unkomprimiert)', desc: 'Für DaVinci Resolve' },
    { value: 'aac', label: 'AAC', desc: 'MPEG Audio Layer' },
    { value: 'mp3', label: 'MP3', desc: 'MPEG Audio Layer 3' },
    { value: 'flac', label: 'FLAC', desc: 'Verlustfrei komprimiert' },
    { value: 'opus', label: 'Opus', desc: 'Moderne Kompression' },
    { value: 'vorbis', label: 'Vorbis', desc: 'Ogg Vorbis Codec' },
    { value: 'copy', label: 'Original kopieren', desc: 'Keine Audio-Konvertierung' }
  ]

  const bitrateOptions = [
    { value: '64k', label: '64 kbps' },
    { value: '128k', label: '128 kbps' },
    { value: '192k', label: '192 kbps' },
    { value: '256k', label: '256 kbps' },
    { value: '320k', label: '320 kbps' }
  ]

  const filenameOptions = [
    { value: 'original', label: 'Original ersetzen', desc: 'Datei wird überschrieben' },
    { value: 'suffix', label: 'Mit Suffix', desc: 'video_fixed.mov' },
    { value: 'prefix', label: 'Mit Präfix', desc: 'fixed_video.mov' }
  ]

  const getOptionLabel = (options: any[], value: string) => {
    return options.find(o => o.value === value)?.label || value
  }

  const getOptionDesc = (options: any[], value: string) => {
    return options.find(o => o.value === value)?.desc || ''
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Codec Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Film className="w-4 h-4 text-primary" />
          Video-Codec
        </label>
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'codec' ? null : 'codec')}
            className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 bg-card transition-all flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm">{getOptionLabel(codecOptions, settings.codec)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getOptionDesc(codecOptions, settings.codec)}</p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'codec' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'codec' && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {codecOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSettingsChange({ ...settings, codec: option.value as any })
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                    settings.codec === option.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Maximize className="w-4 h-4 text-primary" />
          Auflösung
        </label>
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'resolution' ? null : 'resolution')}
            className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 bg-card transition-all flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm">{getOptionLabel(resolutionOptions, settings.resolution)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getOptionDesc(resolutionOptions, settings.resolution)}</p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'resolution' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'resolution' && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {resolutionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSettingsChange({ ...settings, resolution: option.value as any })
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                    settings.resolution === option.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FPS Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Film className="w-4 h-4 text-primary" />
          Frames (FPS)
        </label>
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'fps' ? null : 'fps')}
            className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 bg-card transition-all flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm">{getOptionLabel(fpsOptions, settings.fps)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getOptionDesc(fpsOptions, settings.fps)}</p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'fps' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'fps' && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {fpsOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSettingsChange({ ...settings, fps: option.value as any })
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                    settings.fps === option.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audio Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Headphones className="w-4 h-4 text-primary" />
          Audio
        </label>
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'audio' ? null : 'audio')}
            className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 bg-card transition-all flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm">{getOptionLabel(audioOptions, settings.audio)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getOptionDesc(audioOptions, settings.audio)}</p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'audio' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'audio' && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {audioOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSettingsChange({ ...settings, audio: option.value as any })
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                    settings.audio === option.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audio Bitrate Selection (nur für komprimierte Formate) */}
        {settings.audio !== 'pcm' && settings.audio !== 'copy' && settings.audio !== 'flac' && (
          <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">Bitrate</label>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'bitrate' ? null : 'bitrate')}
              className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 bg-card transition-all flex items-center justify-between"
            >
              <p className="font-medium text-sm">{getOptionLabel(bitrateOptions, settings.audioBitrate)}</p>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'bitrate' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'bitrate' && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl">
                {bitrateOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSettingsChange({ ...settings, audioBitrate: option.value })
                      setOpenDropdown(null)
                    }}
                    className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                      settings.audioBitrate === option.value ? 'bg-primary/10' : ''
                    }`}
                  >
                    <p className="font-medium text-sm">{option.label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Directory */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <FolderOutput className="w-4 h-4 text-primary" />
          Ausgabeverzeichnis
        </label>
        <button
          onClick={() => onSettingsChange({ ...settings, outputToNewDir: !settings.outputToNewDir })}
          className={`w-full text-left p-3 rounded-lg border transition-all ${
            settings.outputToNewDir ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{settings.outputToNewDir ? 'Neues Verzeichnis' : 'Gleiches Verzeichnis'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {settings.outputToNewDir ? 'Speichert in "transcoded" Unterordner' : 'Speichert im gleichen Ordner'}
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${settings.outputToNewDir ? 'bg-primary' : 'bg-secondary'} relative`}>
              <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${settings.outputToNewDir ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
        </button>
      </div>

      {/* Filename Pattern */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <FileText className="w-4 h-4 text-primary" />
          Dateiname
        </label>
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'filename' ? null : 'filename')}
            className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 bg-card transition-all flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm">{getOptionLabel(filenameOptions, settings.filenamePattern)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getOptionDesc(filenameOptions, settings.filenamePattern)}</p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'filename' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'filename' && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl">
              {filenameOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSettingsChange({ ...settings, filenamePattern: option.value as any })
                    setOpenDropdown(null)
                  }}
                  className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                    settings.filenamePattern === option.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Original */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Trash2 className="w-4 h-4 text-primary" />
          Original-Datei nach Transcoding
        </label>
        <button
          onClick={() => onSettingsChange({ ...settings, deleteOriginal: !settings.deleteOriginal })}
          className={`w-full text-left p-3 rounded-lg border transition-all ${
            settings.deleteOriginal ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-primary/50 bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{settings.deleteOriginal ? 'AN - wird gelöscht' : 'AUS - wird behalten'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {settings.deleteOriginal ? '⚠️ Original wird gelöscht, wenn Transcoding erfolgreich' : 'Original wird nicht gelöscht'}
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${settings.deleteOriginal ? 'bg-red-500' : 'bg-secondary'} relative`}>
              <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${settings.deleteOriginal ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
        </button>
      </div>

      {/* Shutdown After */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Power className="w-4 h-4 text-primary" />
          Nach Abschluss
        </label>
        <button
          onClick={() => onSettingsChange({ ...settings, shutdownAfter: !settings.shutdownAfter })}
          className={`w-full text-left p-3 rounded-lg border transition-all ${
            settings.shutdownAfter ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{settings.shutdownAfter ? 'PC herunterfahren' : 'Nichts unternehmen'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {settings.shutdownAfter ? 'PC wird nach Fertigstellung heruntergefahren' : 'PC läuft weiter'}
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${settings.shutdownAfter ? 'bg-primary' : 'bg-secondary'} relative`}>
              <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${settings.shutdownAfter ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
