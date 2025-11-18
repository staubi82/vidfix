import { useState, useEffect } from 'react'
import { Cpu, Gauge, HardDrive, Zap } from 'lucide-react'

interface ProgressBarProps {
  progress?: string
  isTranscoding?: boolean
}

export default function ProgressBar({}: ProgressBarProps) {
  const [cpu, setCpu] = useState(0)
  const [gpu, setGpu] = useState(0)
  const [gpuTemp, setGpuTemp] = useState(0)
  const [temp, setTemp] = useState(0)
  const [ram, setRam] = useState(0)
  const [ssdUsed, setSsdUsed] = useState(0)
  const [ssdTotal, setSsdTotal] = useState(0)

  // Regelmäßig System-Stats abrufen (alle 2 Sekunden)
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const stats = await window.electronAPI.getSystemStats()
        setCpu(stats.cpu)
        setGpu(stats.gpu)
        setGpuTemp(stats.gpuTemp)
        setTemp(stats.temp)
        setRam(stats.ram)
        setSsdUsed(stats.ssdUsed)
        setSsdTotal(stats.ssdTotal)
      } catch (err) {
        console.error('Error fetching system stats:', err)
      }
    }

    // Sofort beim Laden abrufen
    fetchSystemStats()

    // Dann alle 2 Sekunden
    const interval = setInterval(fetchSystemStats, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-4">
      {/* System Stats - immer anzeigen */}
      <div className="flex items-center justify-between gap-4 h-12 text-xs">
        {/* CPU Last - Temp */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-1.5 rounded flex-shrink-0 ${
            cpu > 80 ? 'bg-red-500/20' : cpu > 50 ? 'bg-yellow-500/20' : 'bg-green-500/20'
          }`}>
            <Cpu className={`w-3 h-3 ${
              cpu > 80 ? 'text-red-400' : cpu > 50 ? 'text-yellow-400' : 'text-green-400'
            }`} />
          </div>
          <span className="font-medium text-muted-foreground whitespace-nowrap">CPU</span>
          <span className="font-semibold whitespace-nowrap">{cpu}%</span>
          <span className="text-muted-foreground">-</span>
          <span className={`font-semibold ${
            temp > 80 ? 'text-red-400' : temp > 65 ? 'text-yellow-400' : 'text-cyan-400'
          }`}>{temp}°C</span>
        </div>

        {/* GPU Last - Temp */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-1.5 rounded flex-shrink-0 ${
            gpu > 80 ? 'bg-red-500/20' : gpu > 50 ? 'bg-yellow-500/20' : 'bg-green-500/20'
          }`}>
            <Gauge className={`w-3 h-3 ${
              gpu > 80 ? 'text-red-400' : gpu > 50 ? 'text-yellow-400' : 'text-green-400'
            }`} />
          </div>
          <span className="font-medium text-muted-foreground whitespace-nowrap">GPU</span>
          <span className="font-semibold whitespace-nowrap">{gpu}%</span>
          <span className="text-muted-foreground">-</span>
          <span className={`font-semibold ${
            gpuTemp > 80 ? 'text-red-400' : gpuTemp > 65 ? 'text-yellow-400' : 'text-cyan-400'
          }`}>{gpuTemp > 0 ? `${gpuTemp}°C` : 'n/a'}</span>
        </div>

        {/* RAM */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-1.5 rounded flex-shrink-0 ${
            ram > 80 ? 'bg-orange-500/20' : ram > 60 ? 'bg-blue-500/20' : 'bg-cyan-500/20'
          }`}>
            <Zap className={`w-3 h-3 ${
              ram > 80 ? 'text-orange-400' : ram > 60 ? 'text-blue-400' : 'text-cyan-400'
            }`} />
          </div>
          <span className="font-medium text-muted-foreground whitespace-nowrap">RAM</span>
          <span className="font-semibold whitespace-nowrap">{ram}%</span>
        </div>

        {/* SSD */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-1.5 rounded flex-shrink-0 ${
            ssdTotal > 0 && ssdUsed / ssdTotal > 0.85 ? 'bg-red-500/20' : ssdTotal > 0 && ssdUsed / ssdTotal > 0.7 ? 'bg-yellow-500/20' : 'bg-green-500/20'
          }`}>
            <HardDrive className={`w-3 h-3 ${
              ssdTotal > 0 && ssdUsed / ssdTotal > 0.85 ? 'text-red-400' : ssdTotal > 0 && ssdUsed / ssdTotal > 0.7 ? 'text-yellow-400' : 'text-green-400'
            }`} />
          </div>
          <span className="font-medium text-muted-foreground whitespace-nowrap">SSD</span>
          <span className="font-semibold whitespace-nowrap">
            {ssdUsed > 0 ? Math.round(ssdUsed) : '?'}/{ssdTotal > 0 ? Math.round(ssdTotal) : '?'} GB
          </span>
        </div>
      </div>
    </div>
  )
}
