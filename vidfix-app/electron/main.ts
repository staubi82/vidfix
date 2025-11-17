import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { readdirSync, statSync, readFileSync, lstatSync } from 'fs'
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

  console.log('Home directory:', homeDir, '| USER:', process.env.USER, '| HOME:', process.env.HOME)
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
  console.log('Starting transcode with options:', options)

  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, '../../vidfix')
    console.log('Script path:', scriptPath)
    console.log('Output dir:', options.outputDir)

    // Start vidfix script in quick mode
    const vidfix = spawn(scriptPath, ['-go'], {
      cwd: options.outputDir,
      shell: true,
      env: {
        ...process.env,
        FILES: JSON.stringify(options.files),
        CODEC: options.codec,
        RESOLUTION: options.resolution,
        FPS: options.fps,
        AUDIO: options.audio,
        AUDIO_BITRATE: options.audioBitrate
      }
    })

    vidfix.stdout.on('data', (data) => {
      const line = data.toString()
      console.log('vidfix stdout:', line)
      mainWindow?.webContents.send('transcode-progress', line)
    })

    vidfix.stderr.on('data', (data) => {
      const line = data.toString()
      console.error('vidfix stderr:', line)
      mainWindow?.webContents.send('transcode-progress', line)
    })

    vidfix.on('error', (err) => {
      console.error('Failed to start vidfix:', err)
      reject(err)
    })

    vidfix.on('close', (code) => {
      console.log('vidfix exited with code:', code)
      currentTranscodeProcess = null
      resolve({ success: code === 0 })
    })

    currentTranscodeProcess = vidfix
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
