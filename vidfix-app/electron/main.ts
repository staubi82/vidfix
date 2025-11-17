import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, basename, extname } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { readdirSync, statSync, readFileSync, lstatSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import * as os from 'os'

let mainWindow: BrowserWindow | null = null
let currentTranscodeProcess: ChildProcess | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0a',
      symbolColor: '#ffffff',
      height: 40
    }
  })

  // In development, load from vite dev server
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Helper Functions

// CPU measurement cache for delta calculation
let lastCpuMeasure: { idle: number; total: number; timestamp: number } | null = null

// Get system stats (CPU, GPU, Temp, RAM, SSD) - AMD optimiert
async function getSystemStats() {
  const stats = {
    cpu: 0,
    gpu: 0,
    gpuTemp: 0,
    temp: 0,
    ram: 0,
    ramTotal: 0,
    ssdUsed: 0,
    ssdTotal: 0
  }

  try {
    // CPU Usage - berechne die Auslastung über Delta zwischen zwei Messungen
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdle += cpu.times.idle
    })

    const now = Date.now()

    if (lastCpuMeasure) {
      const idleDiff = totalIdle - lastCpuMeasure.idle
      const totalDiff = totalTick - lastCpuMeasure.total

      if (totalDiff > 0) {
        const cpuUsage = 100 - (idleDiff / totalDiff * 100)
        stats.cpu = Math.max(0, Math.min(100, Math.round(cpuUsage)))
      }
    }

    // Speichere aktuelle Messung für nächste Berechnung
    lastCpuMeasure = { idle: totalIdle, total: totalTick, timestamp: now }

    // GPU Usage - AMD optimiert (mehrere Methoden)

    // 1. AMD: sysfs Interface card0
    try {
      const gpuBusy = readFileSync('/sys/class/drm/card0/device/gpu_busy_percent', 'utf-8')
      const gpuVal = parseInt(gpuBusy.trim())
      if (!isNaN(gpuVal) && gpuVal > 0) {
        stats.gpu = gpuVal
      }
    } catch {}

    // 2. AMD: sysfs Interface card1 (falls card0 nicht die GPU ist)
    if (stats.gpu === 0) {
      try {
        const gpuBusy = readFileSync('/sys/class/drm/card1/device/gpu_busy_percent', 'utf-8')
        const gpuVal = parseInt(gpuBusy.trim())
        if (!isNaN(gpuVal) && gpuVal > 0) {
          stats.gpu = gpuVal
        }
      } catch {}
    }

    // 3. AMD: amdgpu_top (beste Option für moderne AMD GPUs)
    if (stats.gpu === 0) {
      try {
        const amdgpuResult = await new Promise<string>((resolve, reject) => {
          const proc = spawn('amdgpu_top', ['-J', '-d'], { timeout: 2000 })
          let output = ''
          proc.stdout.on('data', (data) => { output += data.toString() })
          proc.on('close', () => resolve(output))
          proc.on('error', reject)
          setTimeout(() => { proc.kill(); reject() }, 2000)
        })

        // Parse JSON für gpu_activity.GFX.value
        const match = amdgpuResult.match(/"gpu_activity"[^}]*"GFX"[^}]*"value"\s*:\s*(\d+)/)
        if (match) {
          stats.gpu = parseInt(match[1]) || 0
        }
      } catch {}
    }

    // GPU Temperature - AMD hwmon
    try {
      // Versuche verschiedene hwmon Pfade für AMD GPUs
      const hwmonPaths = [
        '/sys/class/drm/card0/device/hwmon/hwmon0/temp1_input',
        '/sys/class/drm/card0/device/hwmon/hwmon1/temp1_input',
        '/sys/class/drm/card0/device/hwmon/hwmon2/temp1_input',
        '/sys/class/drm/card1/device/hwmon/hwmon0/temp1_input',
        '/sys/class/drm/card1/device/hwmon/hwmon1/temp1_input',
        '/sys/class/drm/card1/device/hwmon/hwmon2/temp1_input',
      ]

      for (const path of hwmonPaths) {
        try {
          const tempData = readFileSync(path, 'utf-8')
          const tempVal = Math.round(parseInt(tempData.trim()) / 1000)
          // Plausibilitätscheck: zwischen 20 und 120 Grad
          if (tempVal > 20 && tempVal < 120) {
            stats.gpuTemp = tempVal
            break
          }
        } catch {}
      }
    } catch {}

    // Temperature - mehrere Methoden

    // 1. sensors command (von lm-sensors)
    try {
      const sensorsResult = await new Promise<string>((resolve, reject) => {
        const proc = spawn('sensors', [], { timeout: 2000 })
        let output = ''
        proc.stdout.on('data', (data) => { output += data.toString() })
        proc.on('close', () => resolve(output))
        proc.on('error', reject)
        setTimeout(() => { proc.kill(); reject() }, 2000)
      })

      // Suche nach Tctl oder Package id 0
      const match = sensorsResult.match(/(Package id 0|Tctl):\s+\+(\d+)/)
      if (match) {
        stats.temp = parseInt(match[2]) || 0
      }
    } catch {}

    // 2. Fallback: thermal_zone
    if (stats.temp === 0) {
      try {
        // Versuche verschiedene thermal zones
        for (let i = 0; i < 10; i++) {
          try {
            const tempData = readFileSync(`/sys/class/thermal/thermal_zone${i}/temp`, 'utf-8')
            const tempVal = Math.round(parseInt(tempData.trim()) / 1000)
            // Plausibilitätscheck: zwischen 20 und 120 Grad
            if (tempVal > 20 && tempVal < 120) {
              stats.temp = tempVal
              break
            }
          } catch {}
        }
      } catch {}
    }

    // RAM Usage
    try {
      const totalmem = os.totalmem()
      const freemem = os.freemem()
      const usedmem = totalmem - freemem
      stats.ramTotal = Math.round(totalmem / 1024 / 1024 / 1024) // in GB
      stats.ram = Math.round((usedmem / totalmem) * 100)
    } catch (err) {
      console.error('[RAM] Error:', err)
    }

    // SSD Usage - Speicherplatz von /home/staubi/Videos (nur dieser Ordner)
    try {
      // Verwende du -s (summary) für Videos-Ordner in Bytes
      const duResult = await new Promise<string>((resolve, reject) => {
        const proc = spawn('du', ['-sb', '/home/staubi/Videos'], { timeout: 5000 })
        let output = ''
        proc.stdout.on('data', (data) => { output += data.toString() })
        proc.on('close', () => resolve(output))
        proc.on('error', reject)
        setTimeout(() => { proc.kill(); reject() }, 5000)
      })

      // Parse "1234567890    /home/staubi/Videos" format (bytes)
      const match = duResult.match(/^(\d+)/)
      if (match) {
        const bytes = parseInt(match[1])
        stats.ssdUsed = Math.round(bytes / 1024 / 1024 / 1024) // Convert to GB
      }

      // Get total space from df for the partition
      const dfResult = await new Promise<string>((resolve, reject) => {
        const proc = spawn('df', ['-BG', '/home/staubi/Videos'], { timeout: 2000 })
        let output = ''
        proc.stdout.on('data', (data) => { output += data.toString() })
        proc.on('close', () => resolve(output))
        proc.on('error', reject)
        setTimeout(() => { proc.kill(); reject() }, 2000)
      })

      const lines = dfResult.trim().split('\n')
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/)
        if (parts.length >= 2) {
          const totalStr = parts[1].replace('G', '')
          stats.ssdTotal = parseInt(totalStr) || 0
        }
      }
    } catch {
      // Keep defaults
    }
  } catch (err) {
    console.error('Error getting system stats:', err)
  }

  return stats
}

// Helper function: Calculate output path based on settings
function calculateOutputPath(
  inputPath: string,
  outputDir: string,
  outputToNewDir: boolean,
  filenamePattern: 'original' | 'suffix' | 'prefix'
): string {
  const dir = outputToNewDir ? join(outputDir, 'transcoded') : outputDir
  const nameWithoutExt = basename(inputPath, extname(inputPath))
  const ext = '.mov' // Always output as .mov for compatibility

  // Create output directory if needed
  if (outputToNewDir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  let outputName: string
  switch (filenamePattern) {
    case 'original':
      outputName = nameWithoutExt + ext
      break
    case 'suffix':
      outputName = `${nameWithoutExt}_fixed${ext}`
      break
    case 'prefix':
      outputName = `fixed_${nameWithoutExt}${ext}`
      break
  }

  return join(dir, outputName)
}

// Helper function: Get video duration in seconds using ffprobe
async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ])

    let output = ''
    ffprobe.stdout.on('data', (data) => {
      output += data.toString()
    })

    ffprobe.on('close', () => {
      const duration = parseFloat(output.trim())
      resolve(isNaN(duration) ? 0 : duration)
    })

    ffprobe.on('error', () => {
      resolve(0)
    })
  })
}

// Helper function: Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Helper function: Build ffmpeg arguments based on codec and settings
function buildFfmpegArgs(
  inputPath: string,
  outputPath: string,
  codec: string,
  resolution: string,
  fps: string,
  audio: string,
  audioBitrate: string
): string[] {
  const args: string[] = [
    '-i', inputPath,
    '-y', // Overwrite output file
    '-progress', 'pipe:2' // Send progress to stderr
  ]

  // Video filters
  const filters: string[] = []

  // Resolution filter
  if (resolution !== 'original') {
    const [width, height] = resolution.split('x')
    filters.push(`scale='min(${width},iw)':'min(${height},ih)':force_original_aspect_ratio=decrease`)
  }

  // Apply filters if any
  if (filters.length > 0) {
    args.push('-vf', filters.join(','))
  }

  // FPS
  if (fps !== 'original') {
    args.push('-r', fps)
  }

  // Video codec specific parameters
  switch (codec) {
    case 'dnxhr_sq':
      args.push('-c:v', 'dnxhd', '-profile:v', 'dnxhr_sq', '-pix_fmt', 'yuv422p')
      break
    case 'dnxhr_hq':
      args.push('-c:v', 'dnxhd', '-profile:v', 'dnxhr_hq', '-pix_fmt', 'yuv422p')
      break
    case 'dnxhr_hqx':
      args.push('-c:v', 'dnxhd', '-profile:v', 'dnxhr_hqx', '-pix_fmt', 'yuv422p10le')
      break
    case 'prores':
      args.push('-c:v', 'prores_ks', '-profile:v', '2', '-pix_fmt', 'yuv422p10le')
      break
    case 'h264':
      args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23')
      break
    case 'h265':
      args.push('-c:v', 'libx265', '-preset', 'medium', '-crf', '28')
      break
    case 'vp9':
      args.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0')
      break
    case 'av1':
      args.push('-c:v', 'libaom-av1', '-crf', '30', '-b:v', '0')
      break
  }

  // Audio codec
  switch (audio) {
    case 'pcm':
      args.push('-c:a', 'pcm_s16le')
      break
    case 'aac':
      args.push('-c:a', 'aac', '-b:a', audioBitrate)
      break
    case 'mp3':
      args.push('-c:a', 'libmp3lame', '-b:a', audioBitrate)
      break
    case 'flac':
      args.push('-c:a', 'flac')
      break
    case 'opus':
      args.push('-c:a', 'libopus', '-b:a', audioBitrate)
      break
    case 'vorbis':
      args.push('-c:a', 'libvorbis', '-b:a', audioBitrate)
      break
    case 'copy':
      args.push('-c:a', 'copy')
      break
  }

  args.push(outputPath)

  return args
}

// IPC Handlers

// Get system stats
ipcMain.handle('get-system-stats', async () => {
  return await getSystemStats()
})

// Get home directory
ipcMain.handle('get-home-dir', async () => {
  // Try different methods to get the correct home directory
  let homeDir = process.env.HOME || process.env.USERPROFILE

  // If that didn't work, try to construct from USER
  if (!homeDir || homeDir === '/home/videos') {
    const user = process.env.USER || process.env.USERNAME
    if (user) {
      homeDir = `/home/${user}`
    } else {
      homeDir = os.homedir()
    }
  }

  return homeDir
})

// Browse directory
ipcMain.handle('browse-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

// List files in directory
ipcMain.handle('list-files', async (_, dirPath: string) => {
  try {
    const files = readdirSync(dirPath)
    const videoFiles = files
      .filter(f => /\.(mp4|mkv|mov)$/i.test(f))
      .map(f => {
        const fullPath = join(dirPath, f)
        const stats = statSync(fullPath)
        return {
          name: f,
          path: fullPath,
          size: stats.size,
          modified: stats.mtime
        }
      })
    return videoFiles
  } catch (err) {
    console.error('Error listing files:', err)
    return []
  }
})

// List directory contents (folders and files)
ipcMain.handle('list-directory', async (_, dirPath: string, showHidden: boolean = false) => {
  try {
    const files = readdirSync(dirPath)
    const items = files
      .filter(f => showHidden || !f.startsWith('.'))
      .map(f => {
        const fullPath = join(dirPath, f)
        const lstat = lstatSync(fullPath)
        return {
          name: f,
          path: fullPath,
          isDirectory: lstat.isDirectory(),
          isHidden: f.startsWith('.')
        }
      })
      .sort((a, b) => {
        // Directories first, then alphabetically
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    return items
  } catch (err) {
    console.error('Error listing directory:', err)
    return []
  }
})

// Get video metadata with ffprobe
ipcMain.handle('get-video-info', async (_, filePath: string) => {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ])

    let output = ''
    ffprobe.stdout.on('data', (data) => {
      output += data.toString()
    })

    ffprobe.on('close', () => {
      try {
        const info = JSON.parse(output)
        resolve(info)
      } catch {
        resolve(null)
      }
    })
  })
})

// Start transcoding
ipcMain.handle('start-transcode', async (_, options: any) => {
  // Process each file (should be only one per call from App.tsx)
  const inputFile = options.files[0]
  if (!inputFile) {
    return Promise.reject(new Error('No input file provided'))
  }

  // Get video duration first
  const totalDuration = await getVideoDuration(inputFile)

  return new Promise((resolve, reject) => {
    // Calculate output path
    const outputPath = calculateOutputPath(
      inputFile,
      options.outputDir,
      options.outputToNewDir,
      options.filenamePattern
    )

    // Build ffmpeg arguments
    const ffmpegArgs = buildFfmpegArgs(
      inputFile,
      outputPath,
      options.codec,
      options.resolution,
      options.fps,
      options.audio,
      options.audioBitrate
    )

    // Start ffmpeg
    const ffmpeg = spawn('ffmpeg', ffmpegArgs)

    let progressBuffer = ''
    let currentFps = 0
    let currentTime = 0

    ffmpeg.stdout.on('data', () => {
      // ffmpeg output handled via stderr progress
    })

    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString()
      progressBuffer += line

      // Parse progress from ffmpeg output
      const progressLines = progressBuffer.split('\n')
      progressBuffer = progressLines.pop() || '' // Keep incomplete line in buffer

      for (const pLine of progressLines) {
        // Parse out_time_ms (time in microseconds)
        const timeMatch = pLine.match(/out_time_ms=(\d+)/)
        if (timeMatch) {
          currentTime = parseInt(timeMatch[1]) / 1000000 // Convert to seconds
        }

        // Parse fps
        const fpsMatch = pLine.match(/fps=\s*([\d.]+)/)
        if (fpsMatch) {
          currentFps = Math.round(parseFloat(fpsMatch[1]))
        }

        // When we have progress=continue, send update to UI
        if (pLine.includes('progress=continue') && totalDuration > 0) {
          const percentage = Math.min(100, Math.round((currentTime / totalDuration) * 100))
          const currentTimeStr = formatTime(currentTime)
          const totalTimeStr = formatTime(totalDuration)

          // Create progress bar visualization
          const barWidth = 20
          const filled = Math.round((percentage / 100) * barWidth)
          const empty = barWidth - filled
          const bar = '█'.repeat(filled) + '░'.repeat(empty)

          // Format: "Fortschritt: [████████░░░░] 80% | 00:42/00:59 | 215 fps"
          const progressMsg = `Fortschritt: [${bar}] ${percentage}% | ${currentTimeStr}/${totalTimeStr} | ${currentFps} fps`

          mainWindow?.webContents.send('transcode-progress', progressMsg)
        }
      }
    })

    ffmpeg.on('error', (err) => {
      console.error('Failed to start ffmpeg:', err)
      currentTranscodeProcess = null
      reject(err)
    })

    ffmpeg.on('close', (code) => {
      currentTranscodeProcess = null

      if (code === 0) {
        // Transcode successful
        // Send 100% completion
        const totalTimeStr = formatTime(totalDuration)
        const bar = '█'.repeat(20)
        const progressMsg = `Fortschritt: [${bar}] 100% | ${totalTimeStr}/${totalTimeStr} | ${currentFps} fps`
        mainWindow?.webContents.send('transcode-progress', progressMsg)

        // Delete original file if requested
        if (options.deleteOriginal && options.filenamePattern !== 'original') {
          try {
            unlinkSync(inputFile)
          } catch (err) {
            console.error('Failed to delete original file:', err)
            // Don't fail the whole operation if deletion fails
          }
        }

        resolve({ success: true })
      } else {
        resolve({ success: false })
      }
    })

    currentTranscodeProcess = ffmpeg
  })
})

// Pause transcoding
ipcMain.handle('pause-transcode', async () => {
  if (currentTranscodeProcess && currentTranscodeProcess.pid) {
    process.kill(currentTranscodeProcess.pid, 'SIGSTOP')
    return { success: true }
  }
  return { success: false }
})

// Resume transcoding
ipcMain.handle('resume-transcode', async () => {
  if (currentTranscodeProcess && currentTranscodeProcess.pid) {
    process.kill(currentTranscodeProcess.pid, 'SIGCONT')
    return { success: true }
  }
  return { success: false }
})

// Cancel transcoding
ipcMain.handle('cancel-transcode', async () => {
  if (currentTranscodeProcess && currentTranscodeProcess.pid) {
    process.kill(currentTranscodeProcess.pid, 'SIGTERM')
    currentTranscodeProcess = null
    return { success: true }
  }
  return { success: false }
})

// Shutdown system (als Manjaro-Nutzer, nicht root)
ipcMain.handle('shutdown-system', async () => {
  try {
    // Verwende systemctl poweroff ohne sudo
    // Der Nutzer muss in der polkit-Regel erlaubt sein
    const shutdown = spawn('systemctl', ['poweroff', '-i'])

    return new Promise((resolve) => {
      shutdown.on('close', (code) => {
        resolve({ success: code === 0 })
      })

      shutdown.on('error', (err) => {
        console.error('Shutdown error:', err)
        resolve({ success: false })
      })
    })
  } catch (err) {
    console.error('Shutdown failed:', err)
    return { success: false }
  }
})
