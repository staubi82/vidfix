# VidFix Pro - Moderne Desktop-App für Video-Transcoding

Eine professionelle Electron-basierte Desktop-Anwendung für die Konvertierung von DJI Action 5 Pro Videos für DaVinci Resolve.

## ✨ Features

### 🎨 Modernes Dark-Theme UI
- **3-Spalten-Layout:** Übersichtliche Darstellung von Dateien, Vorschau und Einstellungen
- **Glassmorphism-Effekte:** Moderne Transparenz und Blur-Effekte
- **Animierte UI-Elemente:** Smooth Transitions und Hover-Effekte
- **Gradient-Buttons:** Eye-Catching Call-to-Action Buttons

### 📂 File-Management
- **Ordner-Browser:** Einfaches Durchsuchen lokaler Verzeichnisse
- **Multi-Select:** Mehrere Videos gleichzeitig auswählen
- **Video-Informationen:** Automatische Anzeige von Codec, Auflösung, FPS und Dauer
- **Größenanzeige:** Übersicht über Gesamtgröße der ausgewählten Dateien

### 🎬 Video-Einstellungen
- **4 Codec-Optionen:**
  - **DNxHR SQ** (empfohlen für DaVinci) - Standard Quality
  - **DNxHR HQ** - High Quality für professionelles Color Grading
  - **H.264** - Kompakt für Archivierung
  - **ProRes 422** - Apple-Standard
- **3 Auflösungs-Optionen:**
  - Original beibehalten
  - Max 1080p (4K → 1080p downscale)
  - Max 720p
- **Audio-Optionen:**
  - **PCM (unkomprimiert)** - Perfekt für DaVinci Resolve
  - Original kopieren

### 🚀 Preset-System
Vordefinierte Presets für häufige Use-Cases:
- **DJI Standard** - Optimiert für DJI Action 5 Pro → DaVinci Resolve
- **4K High Quality** - DNxHR HQ, Original-Auflösung
- **Fast 1080p** - DNxHR SQ mit 1080p downscale
- **Archiv H.264** - H.264 komprimiert

### 📊 Live-Progress-Monitoring
- **Echtzeit-Fortschrittsbalken:** Animated mit Prozentanzeige
- **System-Stats:** CPU, GPU und Temperatur-Monitoring
- **FPS-Counter:** Encoding-Geschwindigkeit in Echtzeit
- **Zeit-Anzeige:** Aktuell / Gesamt-Zeit

## 🛠️ Installation

### Voraussetzungen
- **Node.js** (v18 oder höher)
- **ffmpeg** und **ffprobe** installiert

### Setup
```bash
cd vidfix-app
npm install
```

## 🚀 Verwendung

### Development-Modus
```bash
npm run dev
```
Startet die App im Development-Modus mit Hot-Reload.

### Production-Build
```bash
npm run build
```
Erstellt eine fertige App für Linux (.AppImage und .deb).

### App ausführen
```bash
npm start
```

## 📖 Anleitung

1. **Ordner wählen:** Klicke auf "Ordner wählen" und wähle den Ordner mit deinen DJI-Videos
2. **Videos auswählen:** Wähle die Videos aus, die du konvertieren möchtest (Checkbox anklicken)
3. **Einstellungen:** Wähle Codec, Auflösung und Audio-Format (oder nutze ein Preset)
4. **Start:** Klicke auf "Transcoding starten"
5. **Warten:** Verfolge den Fortschritt in Echtzeit
6. **Fertig:** Die konvertierten Videos findest du im Unterordner `transcoded_<Codec>`

## 🎯 Empfohlene Einstellungen für DJI Action 5 Pro

**Für DaVinci Resolve:**
- **Codec:** DNxHR SQ
- **Auflösung:** Max 1080p (wenn 4K nicht nötig)
- **Audio:** PCM (unkomprimiert)

Diese Einstellungen lösen die typischen Probleme:
- ✅ **Kein Ton mehr:** PCM wird von DaVinci Resolve immer unterstützt
- ✅ **Keine Ruckler:** DNxHR ist edit-freundlich (niedrige CPU-Last beim Schneiden)
- ✅ **Schnelles Encoding:** SQ-Profil ist schneller als HQ

## 🏗️ Technologie-Stack

- **Electron** - Desktop-Framework
- **React 19** - UI-Framework
- **TypeScript** - Type-Safety
- **Vite** - Build-Tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📁 Projekt-Struktur

```
vidfix-app/
├── electron/              # Electron Main & Preload
│   ├── main.ts           # Hauptprozess
│   └── preload.ts        # IPC-Bridge
├── src/                  # React App
│   ├── components/       # UI-Komponenten
│   │   ├── FileBrowser.tsx
│   │   ├── VideoPreview.tsx
│   │   ├── Settings.tsx
│   │   ├── ProgressBar.tsx
│   │   └── PresetManager.tsx
│   ├── App.tsx          # Haupt-Komponente
│   ├── main.tsx         # React Entry Point
│   └── index.css        # Tailwind + Custom CSS
├── vidfix               # Original Bash-Script
├── index.html           # HTML Entry Point
└── package.json         # Dependencies
```

## 🐛 Troubleshooting

**Problem: App startet nicht**
- Prüfe ob Node.js installiert ist: `node --version`
- Prüfe ob alle Dependencies installiert sind: `npm install`

**Problem: Videos werden nicht erkannt**
- Stelle sicher dass ffprobe installiert ist: `ffprobe -version`
- Unterstützte Formate: .mp4, .mkv, .mov

**Problem: Transcoding startet nicht**
- Prüfe ob das vidfix-Script ausführbar ist: `chmod +x vidfix`
- Prüfe die Logs in der Konsole (DevTools: Strg+Shift+I)

## 📄 Lizenz

ISC

## 👨‍💻 Entwickelt mit Claude Code

Diese App wurde mit [Claude Code](https://claude.com/claude-code) entwickelt.

---

**Viel Erfolg mit deinen DJI-Videos in DaVinci Resolve! 🎥**
