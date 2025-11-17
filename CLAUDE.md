# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference

**IMPORTANT: Always respond in German (Deutsch) when communicating with the user.** The user prefers German language for all interactions, explanations, and discussions. Code, comments, and technical documentation can remain in English, but all conversational responses should be in German.

## Version Control & GitHub Integration

**IMPORTANT: This project is version-controlled with Git and backed up on GitHub.**

- **Repository:** `https://github.com/staubi82/vidfix` (Private)
- **Branch:** `main`
- **Commit Policy:** Always commit and push changes to GitHub after making modifications
- **Workflow:** After any code changes or updates:
  1. Stage changes: `git add -A`
  2. Create descriptive commit with Claude Code attribution
  3. Push to GitHub: `git push origin main`

**Auto-backup instruction:** Whenever you make changes to any project files, you MUST create a commit and push to GitHub immediately after the changes are complete. Include a clear, descriptive commit message explaining what was changed and why.

## Project Overview

This is a dual-component video transcoding project for DJI Action 5 Pro videos:

1. **vidfix** - Bash script for batch video transcoding with ffmpeg
2. **vidfix-app/** - Modern Electron desktop application with React UI

Both components solve the same problem: converting DJI Action 5 Pro videos to formats compatible with DaVinci Resolve (particularly fixing audio codec and video encoding issues).

## Common Commands

### Bash Script (vidfix)
```bash
# Interactive mode
./vidfix

# Quick mode (uses default settings: DNxHR SQ, 1080p, PCM audio)
./vidfix -go
./vidfix --go
```

### Electron App (vidfix-app/)
```bash
cd vidfix-app

# Development with hot-reload
npm run dev

# Build for production (creates .AppImage and .deb)
npm run build

# Preview built app
npm run preview
```

### Testing
- The bash script has no formal tests - test manually with sample videos
- The Electron app has no test suite configured

## Architecture

### Bash Script (vidfix)

A 1300+ line interactive bash script with the following structure:

**Core Workflow:**
1. Configuration (lines 8-19): Bookmarks, quality maps, VAAPI device
2. Quick mode detection (lines 21-30): `-go` flag bypasses prompts
3. Navigation helpers (lines 36-49): 'q' to quit, 'z' to restart
4. File selection: Recursive directory browsal, multi-select support
5. Codec/resolution selection: DNxHR SQ/HQ, ProRes 422, H.264
6. Parallel processing: Sequential (with progress bar) or parallel (2-3 jobs)
7. Output validation: Duration comparison, file size checks
8. State management: `.transcoding_state` file for resume capability

**Key Functions:**
- `progress_bar()` (55-85): Colored progress visualization
- `get_duration()` (105-147): Handles both normal duration and DJI frame-based calculation
- `check_duplicates()` (149-191): Fast hash-based duplicate detection
- `show_live_stats()` (193-339): Real-time CPU/GPU/temp monitoring (AMD optimized)
- `transcode_file()` (1010-1238): Main transcoding logic with ffmpeg commands

**Hardware Acceleration:**
- CPU mode: Uses libx264 or native codecs (dnxhd, prores_ks)
- GPU mode: VAAPI for H.264 (AMD/Intel)
- GPU monitoring: amdgpu_top, nvtop, sysfs interfaces

### Electron App (vidfix-app/)

**Three-Process Architecture:**

1. **Main Process** (`electron/main.ts`)
   - Window management and IPC handlers
   - File system operations (directory browsing, video scanning)
   - Spawns `vidfix` bash script as child process
   - System monitoring (CPU, GPU, temperature via sysfs)
   - IPC channels: `browse-directory`, `list-files`, `get-video-info`, `start-transcode`, `get-system-stats`

2. **Preload Script** (`electron/preload.ts`)
   - Context bridge between main and renderer
   - Exposes `window.electronAPI` with type-safe methods
   - Handles bidirectional communication

3. **Renderer Process** (`src/`)
   - React 19 with TypeScript
   - Tailwind CSS with custom glassmorphism effects
   - Component structure:
     - `App.tsx`: Main orchestrator, state management
     - `FileBrowser.tsx`: Directory navigation and file selection
     - `VideoPreview.tsx`: ffprobe-based metadata display
     - `Settings.tsx`: Codec/resolution/audio configuration
     - `ProgressBar.tsx`: Real-time transcoding progress with system stats
     - `PresetManager.tsx`: Quick preset selection (DJI Standard, 4K HQ, etc.)

**Data Flow:**
```
User Action → Renderer (React) → IPC → Main Process → vidfix script → ffmpeg
                                   ↑                      ↓
                        Progress Updates ← stdout parsing
```

**State Management:**
- Local React state (useState) - no Redux/Zustand
- Settings persist in component state only (no localStorage)
- File selection tracked via `Set<string>` for O(1) lookup

**TypeScript Types:**
- Global types in `src/global.d.ts` for window.electronAPI
- Interfaces: `VideoFile`, `TranscodeOptions`, `TranscodeSettings`
- Strict TypeScript config with `noUnusedLocals` and `noUnusedParameters`

## Important Implementation Details

### Video Processing

**Supported Codecs:**
- DNxHR SQ/HQ: Requires `yuv422p` pixel format
- ProRes 422: Requires `yuv422p10le` pixel format
- H.264: Uses `nv12` for VAAPI, any for libx264

**Audio Conversion:**
- Default: PCM 16-bit (`pcm_s16le`) - DaVinci Resolve compatible
- Alternative: Copy original audio codec

**Validation Logic:**
- Duration tolerance: 2% of original (min 5 seconds)
- For videos < 10s: 2-second tolerance
- File size check: Must be > 1000 bytes
- Hash-based duplicate detection: Uses size + mtime (fast, not SHA256)

### System Monitoring

**AMD GPU Detection Priority:**
1. `amdgpu_top -J -d` (JSON output, best for modern AMD)
2. `nvtop -b -d 1` (universal, works with AMD/NVIDIA/Intel)
3. `/sys/class/drm/card0/device/gpu_busy_percent` (sysfs)
4. `/sys/class/drm/card1/device/gpu_busy_percent` (alternative card)
5. hwmon interfaces

**CPU Monitoring:**
- Bash script: Uses `ps -p $pid -o %cpu`
- Electron: Uses `os.cpus()` with idle/total calculation

### Build Configuration

**electron-vite** setup:
- Main: TypeScript → CommonJS in `out/main/`
- Preload: TypeScript → CommonJS in `out/preload/`
- Renderer: React + Vite → `out/renderer/`
- Path alias: `@/*` → `src/*`

**Development vs Production:**
- Dev: Vite dev server on `http://localhost:5173`
- Prod: Loads from `out/renderer/index.html`
- DevTools auto-open in development

## Common Patterns

### Adding New Codec Support

1. Update `Settings.tsx` codec options
2. Add case in `vidfix` script's codec selection (line ~740)
3. Set appropriate pixel format in `transcode_file()` (line ~1093+)
4. Update `estimate_space()` calculation (line ~341)

### Adding IPC Channel

1. Define handler in `electron/main.ts` with `ipcMain.handle()`
2. Expose in `electron/preload.ts` via `contextBridge.exposeInMainWorld()`
3. Add type definition to `src/global.d.ts`
4. Call from React component via `window.electronAPI.yourMethod()`

### Progress Parsing

The bash script outputs ffmpeg progress via `pipe:2` and parses:
- `out_time_ms=`: Current position in microseconds
- `fps=`: Encoding FPS for display
- Main process captures stdout/stderr and sends via IPC to renderer

## Dependencies

**External Tools Required:**
- `ffmpeg` and `ffprobe` (must be in PATH)
- Optional: `amdgpu_top`, `nvtop`, `sensors` for monitoring

**Node Modules:**
- React 19 with TypeScript
- Electron with electron-builder
- Tailwind CSS + PostCSS
- Lucide React for icons
- No state management libraries (Redux, MobX, etc.)

## File Naming Conventions

**Bash Script Output:**
- Pattern 1: Replace original (dangerous)
- Pattern 2: `_fixed` suffix (default)
- Pattern 3: Same name in new directory

**Electron App:**
- `original`: Replaces file in place
- `suffix`: Adds `_fixed` before extension
- `prefix`: Adds prefix to filename

## Known Quirks

- DJI Action 5 Pro videos may have frame-based duration instead of time-based - handled in `get_duration()` with frames/FPS fallback
- VAAPI encoding uses different pixel format path (hwupload) vs CPU
- Progress parsing in bash is tricky - ffmpeg's `-progress pipe:2` requires careful stdout/stderr handling
- The app duplicates the vidfix script in vidfix-app/ directory (keep in sync)
