# VidFix Pro

**Professional Video Transcoding Tool for DJI Action 5 Pro**

VidFix Pro ist eine leistungsstarke Lösung zur Konvertierung von DJI Action 5 Pro Videos in Formate, die mit DaVinci Resolve kompatibel sind. Das Projekt besteht aus zwei Komponenten: einem interaktiven Bash-Script und einer modernen Electron Desktop-Anwendung.

![VidFix Pro UI](screenshots/vidfix-app-ui.png)

## 🚀 Features

### Electron Desktop App (vidfix-app)

- **Moderne Benutzeroberfläche**: React 19 + TypeScript mit Glassmorphism-Design
- **Batch-Processing**: Mehrere Videos gleichzeitig verarbeiten
- **Echtzeit-Monitoring**: Live CPU/GPU/RAM/Temperatur-Überwachung
- **Video-Vorschau**: ffprobe-basierte Metadaten-Anzeige
- **Preset-Manager**: Vordefinierte Einstellungen (DJI Standard, 4K HQ, etc.)
- **Flexible Ausgabe**: Verschiedene Dateinamen-Optionen (Original, Suffix, Prefix)

### Bash Script (vidfix)

- **Interaktiver Modus**: Geführte Auswahl von Dateien und Einstellungen
- **Quick Mode**: Schnellstart mit `-go` Flag für Standardeinstellungen
- **Hardware-Beschleunigung**: VAAPI-Unterstützung für AMD/Intel GPUs
- **Fortschrittsanzeige**: Echtzeit-Progress mit Systemstatistiken
- **State Management**: Wiederaufnahme unterbrochener Transcodierungen

## 📋 Unterstützte Codecs

| Codec | Pixel Format | Verwendung |
|-------|--------------|------------|
| **DNxHR SQ** | yuv422p | Standard für DaVinci Resolve (empfohlen) |
| **DNxHR HQ** | yuv422p | Höhere Qualität, größere Dateien |
| **ProRes 422** | yuv422p10le | Apple ProRes (macOS-optimiert) |
| **H.264** | nv12/yuv420p | Kompakt, mit GPU-Beschleunigung |

### Audio-Optionen

- **PCM 16-bit** (pcm_s16le): DaVinci Resolve-kompatibel (Standard)
- **Original kopieren**: Behält Original-Audio-Codec bei

## 🛠️ Installation

### Voraussetzungen

```bash
# Arch Linux / Manjaro
sudo pacman -S ffmpeg nodejs npm

# Optional: GPU-Monitoring-Tools
sudo pacman -S nvtop amdgpu_top
```

### Electron App installieren

```bash
cd vidfix-app

# Dependencies installieren
npm install

# Development-Modus starten
npm run dev

# Production Build erstellen
npm run build
```

### Bash Script verwenden

```bash
# Ausführbar machen
chmod +x vidfix

# Interaktiver Modus
./vidfix

# Quick Mode (Standard: DNxHR SQ, 1080p, PCM)
./vidfix -go
```

## 📖 Verwendung

### Electron App

1. **Ordner wählen**: Videos-Verzeichnis auswählen
2. **Videos auswählen**: Checkbox-basierte Mehrfachauswahl
3. **Einstellungen**: Codec, Auflösung, FPS, Audio konfigurieren
4. **Transcoding starten**: Progress-Bar zeigt Fortschritt und System-Stats
5. **Fertig**: Videos werden im gewählten Ausgabeformat gespeichert

### Bash Script - Quick Mode

```bash
# Standard-Einstellungen (DNxHR SQ, 1080p, PCM)
./vidfix -go

# Navigiert automatisch zum Videos-Verzeichnis
# Zeigt alle .mp4/.MP4 Dateien
# Startet Transcoding mit Fortschrittsanzeige
```

## 🏗️ Architektur

### Electron App (Three-Process Architecture)

```
┌─────────────────────────────────────────────────────────┐
│  Main Process (electron/main.ts)                        │
│  - IPC Handlers                                         │
│  - File System Operations                               │
│  - vidfix Script Spawning                               │
│  - System Monitoring                                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Preload Script (electron/preload.ts)                   │
│  - Context Bridge                                       │
│  - Type-safe IPC Communication                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Renderer Process (src/)                                │
│  - React 19 Components                                  │
│  - Tailwind CSS Styling                                 │
│  - State Management (useState)                          │
└─────────────────────────────────────────────────────────┘
```

### Bash Script Workflow

```
Konfiguration → Dateiauswahl → Codec-Auswahl → Verarbeitung → Validierung
                      ↓              ↓               ↓
                  Bookmarks    DNxHR/ProRes    Parallel/Sequentiell
                  Browser      H.264/Custom     Progress Bar
```

## 🔧 Technologie-Stack

### Electron App

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Build**: electron-vite, Vite
- **Icons**: Lucide React
- **Packaging**: electron-builder

### Bash Script

- **Shell**: Bash 4.0+
- **Video Processing**: ffmpeg, ffprobe
- **Monitoring**: amdgpu_top, nvtop, sysfs
- **UI**: ANSI colors, progress bars

## 📊 System-Anforderungen

- **OS**: Linux (getestet auf Arch Linux / Manjaro)
- **CPU**: Multi-Core empfohlen (Parallel-Processing)
- **GPU**: Optional (AMD/Intel mit VAAPI für Hardware-Beschleunigung)
- **RAM**: Mind. 8 GB (abhängig von Video-Auflösung)
- **Speicher**: 2-3x der Original-Video-Größe für DNxHR/ProRes

## 🐛 Bekannte Besonderheiten

- **DJI Frame-based Duration**: DJI Action 5 Pro Videos haben teilweise frame-basierte statt zeitbasierte Duration-Metadaten - wird automatisch erkannt und behandelt
- **VAAPI Pixel Format**: Hardware-beschleunigte Encodierung verwendet unterschiedliche Pixel-Format-Pipelines (`hwupload`)
- **vidfix Duplikat**: Das Bash-Script liegt sowohl im Root als auch in `vidfix-app/` (bei Änderungen synchron halten!)

## 📝 Dateinamen-Konventionen

### Bash Script

- **Pattern 1**: Original überschreiben (⚠️ gefährlich)
- **Pattern 2**: `_fixed` Suffix (Standard)
- **Pattern 3**: Gleicher Name in neuem Verzeichnis

### Electron App

- **Original**: Überschreibt Datei an Ort und Stelle
- **Suffix**: Fügt `_fixed` vor Dateiendung hinzu
- **Prefix**: Fügt Präfix zum Dateinamen hinzu

## 🧪 Entwicklung

```bash
cd vidfix-app

# Development mit Hot-Reload
npm run dev

# TypeScript prüfen
npx tsc --noEmit

# Build für Production
npm run build

# Gebaute App testen
npm run preview
```

## 📦 Build-Artefakte

Nach `npm run build`:

- **AppImage**: `vidfix-app/dist/vidfix-app-1.0.0.AppImage` (portable)
- **DEB**: `vidfix-app/dist/vidfix-app_1.0.0_amd64.deb` (Debian/Ubuntu)

## 🤝 Beiträge

Dieses Projekt ist privat. Bei Fragen oder Verbesserungsvorschlägen bitte direkt kontaktieren.

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

---

**Entwickelt mit ❤️ und [Claude Code](https://claude.com/claude-code)**
