import { useState } from 'react'
import { Film, Youtube, Video, Smartphone, Settings, ChevronDown } from 'lucide-react'
import { getProfileList } from '../constants/profiles'

interface ProfileSelectorProps {
  selectedProfileId: string
  onProfileChange: (profileId: string) => void
}

const iconMap: Record<string, typeof Film> = {
  Film,
  Youtube,
  Video,
  Smartphone,
  Settings
}

export default function ProfileSelector({ selectedProfileId, onProfileChange }: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const profiles = getProfileList()
  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles[profiles.length - 1]

  const handleSelect = (profileId: string) => {
    onProfileChange(profileId)
    setIsOpen(false)
  }

  const IconComponent = iconMap[selectedProfile.icon]

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Video className="w-5 h-5" />
          Plattform-Profile
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Wählen Sie ein vordefiniertes Profil oder passen Sie die Einstellungen manuell an
        </p>
      </div>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3.5
                   hover:bg-white/10 transition-all duration-200 flex items-center justify-between
                   shadow-lg hover:shadow-xl group"
      >
        <div className="flex items-center gap-3">
          {IconComponent && (
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
              <IconComponent className="w-5 h-5 text-blue-400" />
            </div>
          )}
          <div className="text-left">
            <div className="text-white font-medium">{selectedProfile.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{selectedProfile.description}</div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute z-20 w-full mt-2 bg-gray-900/95 backdrop-blur-md border border-white/10
                          rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {profiles.map((profile) => {
              const ProfileIcon = iconMap[profile.icon]
              const isSelected = profile.id === selectedProfileId

              return (
                <button
                  key={profile.id}
                  onClick={() => handleSelect(profile.id)}
                  className={`w-full px-4 py-3.5 flex items-center gap-3 transition-all duration-150
                             ${isSelected
                               ? 'bg-blue-500/20 border-l-4 border-blue-500'
                               : 'hover:bg-white/5 border-l-4 border-transparent'
                             }
                             ${profile.id !== profiles[profiles.length - 1].id ? 'border-b border-white/5' : ''}`}
                >
                  <div className={`p-2 rounded-lg transition-colors
                                  ${isSelected
                                    ? 'bg-blue-500/30'
                                    : 'bg-white/5 group-hover:bg-white/10'
                                  }`}>
                    {ProfileIcon && (
                      <ProfileIcon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                      {profile.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {profile.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
