import { FileVideo, Check } from 'lucide-react'

interface VideoFile {
  name: string
  path: string
  size: number
  modified: Date
}

interface FileBrowserProps {
  files: VideoFile[]
  selectedFiles: Set<string>
  selectedFile: VideoFile | null
  onFileSelect: (file: VideoFile) => void
  currentDir: string
  queuedPaths?: Set<string>
  onSelectAll?: (files: VideoFile[]) => void
  onSelectNone?: () => void
}

export default function FileBrowser({
  files,
  selectedFiles,
  selectedFile,
  onFileSelect,
  currentDir,
  queuedPaths,
  onSelectAll,
  onSelectNone
}: FileBrowserProps) {
  const selectedCount = queuedPaths?.size || 0

  if (!currentDir) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileVideo className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Kein Ordner ausgewählt</p>
          <p className="text-sm mt-1">Wähle einen Ordner um Videos anzuzeigen</p>
        </div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileVideo className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Keine Videos gefunden</p>
          <p className="text-sm mt-1">Dieser Ordner enthält keine .mp4, .mkv oder .mov Dateien</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header mit Überschrift und Aktionsbuttons */}
      <div className="px-4 pt-4 pb-3 space-y-3 flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Videos ({files.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedCount} ausgewählt
          </p>
        </div>

        {/* Buttons für Alle auswählen / Keine auswählen */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectAll?.(files)}
              className="px-3 py-1.5 text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors"
            >
              Alle auswählen
            </button>
            <button
              onClick={() => onSelectNone?.()}
              disabled={selectedCount === 0}
              className="px-3 py-1.5 text-xs font-medium bg-secondary/40 hover:bg-secondary/60 disabled:bg-secondary/20 disabled:text-muted-foreground text-foreground rounded transition-colors disabled:cursor-not-allowed"
            >
              Zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Videoliste */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2 space-y-1">
          {files.map((file) => {
            const isSelected = queuedPaths?.has(file.path) || selectedFiles.has(file.path)
            const isActive = selectedFile?.path === file.path

            return (
              <button
                key={file.path}
                onClick={() => onFileSelect(file)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary/20 border border-primary'
                    : isSelected
                    ? 'bg-primary/10 border border-primary/50'
                    : 'hover:bg-secondary/50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-muted-foreground/30 rounded" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <FileVideo className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
