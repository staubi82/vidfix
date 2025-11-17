import { X, Folder } from 'lucide-react'
import DirectoryBrowser from './DirectoryBrowser'
import { useEffect } from 'react'

interface DirectoryModalProps {
  isOpen: boolean
  browserDir: string
  homeDir: string
  onDirectoryChange: (path: string) => void
  onSelect: (path: string) => void
  onClose: () => void
}

export default function DirectoryModal({
  isOpen,
  browserDir,
  homeDir,
  onDirectoryChange,
  onSelect,
  onClose
}: DirectoryModalProps) {
  // Close modal with ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (path: string) => {
    onSelect(path)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Nur schließen wenn auf dem Overlay geklickt wird, nicht auf dem Dialog
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-xl border border-primary/30 shadow-2xl flex flex-col" style={{ width: '100%', height: '90vh', maxWidth: '1200px', maxHeight: '700px' }}>
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-card to-card/80">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            Ordner auswählen
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
            title="Schließen (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Directory Browser */}
        <div className="flex-1 overflow-hidden">
          <DirectoryBrowser
            currentDir={browserDir}
            homeDir={homeDir}
            onDirectoryChange={onDirectoryChange}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  )
}
