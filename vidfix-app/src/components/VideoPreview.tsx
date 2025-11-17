import { useState, useEffect } from 'react'
import { Film, Clock, Maximize2, FileVideo } from 'lucide-react'

interface VideoFile {
  name: string
  path: string
  size: number
  modified: Date
}

interface VideoPreviewProps {
  file: VideoFile | null
}

interface VideoInfo {
  format?: {
    duration?: string
    size?: string
    bit_rate?: string
  }
  streams?: Array<{
    codec_name?: string
    codec_type?: string
    width?: number
    height?: number
    r_frame_rate?: string
  }>
}

export default function VideoPreview({ file }: VideoPreviewProps) {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (file) {
      setLoading(true)
      window.electronAPI.getVideoInfo(file.path).then((info) => {
        setVideoInfo(info)
        setLoading(false)
      })
    } else {
      setVideoInfo(null)
    }
  }, [file])

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/20">
        <div className="text-center text-muted-foreground">
          <Film className="w-24 h-24 mx-auto mb-4 opacity-10" />
          <p className="text-lg">Kein Video ausgewählt</p>
          <p className="text-sm mt-2">Wähle ein Video um die Vorschau zu sehen</p>
        </div>
      </div>
    )
  }

  const videoStream = videoInfo?.streams?.find(s => s.codec_type === 'video')
  const audioStream = videoInfo?.streams?.find(s => s.codec_type === 'audio')
  const duration = videoInfo?.format?.duration
    ? Math.floor(parseFloat(videoInfo.format.duration))
    : 0

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFps = (fpsString?: string) => {
    if (!fpsString) return 'N/A'
    const [num, den] = fpsString.split('/').map(Number)
    return den ? Math.round(num / den) : num
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Video Display Area */}
      <div className="flex-1 bg-black/40 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl aspect-video bg-black/60 rounded-lg border border-border/50 flex items-center justify-center relative overflow-hidden">
          {loading ? (
            <div className="text-center">
              <div className="skeleton w-32 h-32 rounded-lg mx-auto mb-4"></div>
              <p className="text-muted-foreground">Lade Video-Informationen...</p>
            </div>
          ) : (
            <div className="text-center p-8">
              <FileVideo className="w-20 h-20 mx-auto mb-4 text-primary/50" />
              <p className="text-lg font-medium mb-2">{file.name}</p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                {videoStream && (
                  <>
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-4 h-4" />
                      {videoStream.width}x{videoStream.height}
                    </span>
                    <span>•</span>
                    <span>{formatFps(videoStream.r_frame_rate)} fps</span>
                  </>
                )}
                {duration > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(duration)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Info Badge */}
          {videoStream && (
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg text-sm font-medium border border-primary/30">
              {videoStream.codec_name?.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Video Info Panel */}
      {videoInfo && (
        <div className="border-t border-border bg-card/80 p-4">
          <h3 className="font-semibold mb-3">Video-Informationen</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Video-Codec</p>
              <p className="font-medium">{videoStream?.codec_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Audio-Codec</p>
              <p className="font-medium">{audioStream?.codec_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Auflösung</p>
              <p className="font-medium">
                {videoStream ? `${videoStream.width}x${videoStream.height}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Dauer</p>
              <p className="font-medium">{formatDuration(duration)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Framerate</p>
              <p className="font-medium">{formatFps(videoStream?.r_frame_rate)} fps</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Größe</p>
              <p className="font-medium">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
