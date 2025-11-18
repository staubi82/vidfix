import { TranscodeSettings } from '../App'

export interface VideoProfile {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  settings: TranscodeSettings
}

export const VIDEO_PROFILES: Record<string, VideoProfile> = {
  davinci: {
    id: 'davinci',
    name: 'DaVinci Resolve',
    description: 'Optimiert für professionelle Videobearbeitung mit DaVinci Resolve',
    icon: 'Film',
    settings: {
      codec: 'dnxhr_sq',
      resolution: '1920x1080',
      fps: '30',
      audio: 'pcm',
      audioBitrate: '192',
      preset: 'DaVinci Resolve',
      outputToNewDir: false,
      filenamePattern: 'suffix',
      deleteOriginal: false,
      shutdownAfter: false,
      useGPU: false
    }
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    description: 'Optimiert für YouTube-Upload (H.264, hohe Kompatibilität)',
    icon: 'Youtube',
    settings: {
      codec: 'h264',
      resolution: '1920x1080',
      fps: '30',
      audio: 'aac',
      audioBitrate: '192',
      preset: 'YouTube',
      outputToNewDir: false,
      filenamePattern: 'suffix',
      deleteOriginal: false,
      shutdownAfter: false,
      useGPU: true
    }
  },
  vimeo: {
    id: 'vimeo',
    name: 'Vimeo',
    description: 'Hohe Qualität für Vimeo (H.264, hohe Bitrate)',
    icon: 'Video',
    settings: {
      codec: 'h264',
      resolution: '1920x1080',
      fps: '30',
      audio: 'aac',
      audioBitrate: '256',
      preset: 'Vimeo',
      outputToNewDir: false,
      filenamePattern: 'suffix',
      deleteOriginal: false,
      shutdownAfter: false,
      useGPU: true
    }
  },
  social: {
    id: 'social',
    name: 'TikTok/Instagram',
    description: 'Kompakte Videos für Social Media (H.264, optimierte Dateigröße)',
    icon: 'Smartphone',
    settings: {
      codec: 'h264',
      resolution: '1920x1080',
      fps: '30',
      audio: 'aac',
      audioBitrate: '128',
      preset: 'TikTok/Instagram',
      outputToNewDir: false,
      filenamePattern: 'suffix',
      deleteOriginal: false,
      shutdownAfter: false,
      useGPU: true
    }
  },
  custom: {
    id: 'custom',
    name: 'Eigene Einstellungen',
    description: 'Manuelle Konfiguration aller Parameter',
    icon: 'Settings',
    settings: {
      codec: 'dnxhr_sq',
      resolution: '1920x1080',
      fps: '30',
      audio: 'pcm',
      audioBitrate: '192',
      preset: 'Eigene Einstellungen',
      outputToNewDir: false,
      filenamePattern: 'suffix',
      deleteOriginal: false,
      shutdownAfter: false,
      useGPU: true
    }
  }
}

export const getProfileById = (id: string): VideoProfile | undefined => {
  return VIDEO_PROFILES[id]
}

export const getProfileList = (): VideoProfile[] => {
  return Object.values(VIDEO_PROFILES)
}
