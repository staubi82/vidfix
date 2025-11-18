# VidFix Pro

**Moderne ffmpeg GUI für professionelle Video-Transcodierung**

Desktop-Anwendung zur Konvertierung von Videos in professionelle Formate (DNxHR, ProRes, H.264/265). Optimiert für DaVinci Resolve, Premiere Pro und Final Cut.

![VidFix Pro UI](screenshots/vidfix-app-ui.png)

## 🚀 Was es macht

- ✅ **Batch-Processing**: Mehrere Videos parallel verarbeiten (2-3 Jobs gleichzeitig)
- ✅ **Professionelle Codecs**: DNxHR SQ/HQ/HQX, ProRes 422, H.264/265, AV1, VP9
- ✅ **Echtzeit-Monitoring**: Live CPU/GPU/RAM-Überwachung während der Konvertierung
- ✅ **Preset-Manager**: Vordefinierte Profile für schnelle Workflows
- ✅ **Hardware-Beschleunigung**: VAAPI für AMD/Intel GPUs

## ⚠️ Was NICHT unterstützt wird

- ❌ **NVIDIA GPUs**: Keine NVENC/CUDA-Unterstützung (nur CPU oder AMD/Intel VAAPI)
- ❌ **Windows/macOS**: Nur Linux

## 📦 Installation

**One-Liner:**

```bash
curl -sSL https://raw.githubusercontent.com/staubi82/vidfix/main/install.sh | bash
```

Das Script lädt automatisch die neueste Version, installiert Desktop-Integration und fügt VidFix Pro ins Startmenü ein.

## 🎬 Unterstützte Codecs

### Video

| Codec | Verwendung | Performance |
|-------|------------|-------------|
| **DNxHR SQ** | DaVinci Resolve Standard | Schnell ⚡ |
| **DNxHR HQ** | Professionelle Workflows | Mittel |
| **ProRes 422** | Final Cut Pro, macOS | Mittel |
| **H.264** | Kompakt, GPU-beschleunigt | Schnell ⚡ |
| **H.265** | Archivierung | Langsam |

### Audio

| Codec | Verwendung |
|-------|------------|
| **PCM 16-bit** | DaVinci Resolve (empfohlen) |
| **AAC** | Universell, kompakt |
| **FLAC** | Verlustfrei, komprimiert |

## 💻 System-Anforderungen

- **OS**: Linux (Arch, Ubuntu, Manjaro, etc.)
- **CPU**: Multi-Core empfohlen (für parallele Verarbeitung)
- **GPU**: AMD/Intel mit VAAPI (optional, für Hardware-Beschleunigung)
- **RAM**: Mind. 8 GB
- **ffmpeg**: Erforderlich (`sudo pacman -S ffmpeg` / `sudo apt install ffmpeg`)

## 🔧 Development

```bash
cd vidfix-app
npm install
npm run dev        # Development mit Hot-Reload
npm run build      # Production Build (.AppImage + .deb)
```

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

---

**Entwickelt mit [Claude Code](https://claude.com/claude-code)**
