import { useState, useEffect } from 'react'
import { Eye, EyeOff, ArrowUp, Folder, FileVideo, Star, Home, Video, Download, FileText } from 'lucide-react'

interface DirectoryItem {
  name: string
  path: string
  isDirectory: boolean
  isHidden: boolean
}

interface DirectoryBrowserProps {
  currentDir: string
  homeDir: string
  onDirectoryChange: (path: string) => void
  onSelect: (path: string) => void
}

const getDefaultFavorites = (homeDir: string) => [
  { label: 'Home', path: homeDir, icon: Home },
  { label: 'Videos', path: `${homeDir}/Videos`, icon: Video },
  { label: 'Downloads', path: `${homeDir}/Downloads`, icon: Download },
  { label: 'Dokumente', path: `${homeDir}/Documents`, icon: FileText }
]

export default function DirectoryBrowser({
  currentDir,
  homeDir,
  onDirectoryChange,
  onSelect
}: DirectoryBrowserProps) {
  const [items, setItems] = useState<DirectoryItem[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [favorites, setFavorites] = useState(getDefaultFavorites(homeDir))
  const [loading, setLoading] = useState(false)

  // Lade Verzeichnis-Inhalt
  const loadDirectory = async (path: string) => {
    setLoading(true)
    try {
      const items = await window.electronAPI.listDirectory(path, showHidden)
      setItems(items)
    } catch (error) {
      console.error('Fehler beim Laden des Verzeichnisses:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Lade Verzeichnis wenn currentDir oder showHidden sich ändert
  useEffect(() => {
    if (currentDir) {
      loadDirectory(currentDir)
    }
  }, [currentDir, showHidden])

  // Navigation zum Elternverzeichnis
  const handleParentDirectory = () => {
    const parent = currentDir.split('/').slice(0, -1).join('/') || '/'
    onDirectoryChange(parent)
  }

  // Navigation in Verzeichnis
  const handleNavigateToDirectory = (path: string) => {
    onDirectoryChange(path)
  }

  // Auswahl des Verzeichnisses
  const handleSelectDirectory = (path: string) => {
    onSelect(path)
  }

  // Favorit hinzufügen/entfernen
  const toggleFavorite = (path: string) => {
    setFavorites(prev => {
      const existing = prev.find(f => f.path === path)
      if (existing) {
        return prev.filter(f => f.path !== path)
      } else {
        const name = path.split('/').pop() || 'Ordner'
        return [...prev, { label: name, path, icon: Folder }]
      }
    })
  }

  const isFavorite = (path: string) => favorites.some(f => f.path === path)

  // Breadcrumb Navigation

  return (
    <div className="flex h-full bg-background">
      {/* Favorites Sidebar */}
      <div className="w-48 border-r border-border bg-card/30 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Favoriten</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {favorites.map((fav) => {
            const Icon = fav.icon
            const isActive = currentDir === fav.path
            return (
              <button
                key={fav.path}
                onClick={() => handleNavigateToDirectory(fav.path)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{fav.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Browser Area */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <div className="border-b border-border bg-card/50 p-3 space-y-2">
          {/* Breadcrumb & Controls */}
          <div className="flex items-center gap-2">
            {/* Parent Directory Button */}
            <button
              onClick={handleParentDirectory}
              disabled={currentDir === '/'}
              className="p-2 hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Ein Verzeichnis nach oben"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Hidden Files Toggle */}
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`p-2 rounded-lg transition-colors ${
                showHidden
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-secondary/50'
              }`}
              title={showHidden ? 'Versteckte Dateien ausblenden' : 'Versteckte Dateien anzeigen'}
            >
              {showHidden ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>

            {/* Add Favorite Button */}
            <button
              onClick={() => toggleFavorite(currentDir)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite(currentDir)
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'hover:bg-secondary/50'
              }`}
              title={isFavorite(currentDir) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            >
              <Star className="w-4 h-4" fill={isFavorite(currentDir) ? 'currentColor' : 'none'} />
            </button>

            {/* Breadcrumb - show as full path */}
            <div className="flex-1 flex items-center px-3 py-1 bg-secondary/30 rounded-lg overflow-x-auto">
              <input
                type="text"
                value={currentDir}
                readOnly
                className="flex-1 bg-transparent text-sm font-mono text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Select Current Directory Button */}
            <button
              onClick={() => handleSelectDirectory(currentDir)}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Auswählen
            </button>
          </div>
        </div>

        {/* Directory Contents */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Wird geladen...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Ordner ist leer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {/* Folders first, then files */}
              {items.filter(item => item.isDirectory).map(item => (
                <button
                  key={item.path}
                  onClick={() => handleNavigateToDirectory(item.path)}
                  onDoubleClick={() => handleNavigateToDirectory(item.path)}
                  className="text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors flex items-center gap-2 group"
                >
                  <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm truncate group-hover:underline">{item.name}</span>
                </button>
              ))}

              {/* Video files */}
              {items.filter(item => !item.isDirectory && /\.(mp4|mkv|mov)$/i.test(item.name)).map(item => (
                <button
                  key={item.path}
                  onClick={() => handleSelectDirectory(currentDir)}
                  className="text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors flex items-center gap-2"
                >
                  <FileVideo className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{item.name}</span>
                </button>
              ))}

              {/* Other files */}
              {items.filter(item => !item.isDirectory && !/\.(mp4|mkv|mov)$/i.test(item.name)).map(item => (
                <div
                  key={item.path}
                  className="text-left px-3 py-2 rounded-lg flex items-center gap-2 text-muted-foreground"
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
