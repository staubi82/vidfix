import { useState } from 'react'
import { ChevronDown, Bookmark } from 'lucide-react'

interface PresetManagerProps {
  currentPreset: string
  onPresetChange: (preset: string) => void
}

const presets = [
  {
    name: 'DJI Standard',
    desc: 'Optimiert für DJI Action 5 Pro → DaVinci Resolve'
  },
  {
    name: '4K High Quality',
    desc: 'DNxHR HQ, Original-Auflösung'
  },
  {
    name: 'Fast 1080p',
    desc: 'DNxHR SQ, 1080p downscale'
  },
  {
    name: 'Archiv H.264',
    desc: 'H.264, komprimiert'
  }
]

export default function PresetManager({ currentPreset, onPresetChange }: PresetManagerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
      >
        <Bookmark className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{currentPreset}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-2 space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    onPresetChange(preset.name)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentPreset === preset.name
                      ? 'bg-primary/20 border border-primary'
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  <p className="font-medium text-sm">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
