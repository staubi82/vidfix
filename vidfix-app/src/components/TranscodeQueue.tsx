import React, { useEffect, useRef, useState } from 'react'
import { X, Trash2, GripVertical } from 'lucide-react'

interface TranscodeQueueProps {
  queue: QueueItem[]
  onRemoveItem: (id: string) => void
  onLoadMetadata: (queueItemId: string, filePath: string) => void
  onClearAll: () => void
  onReorderQueue?: (newQueue: QueueItem[]) => void
}

export function TranscodeQueue({
  queue,
  onRemoveItem,
  onLoadMetadata,
  onClearAll,
  onReorderQueue,
}: TranscodeQueueProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const loadedItemsRef = useRef<Set<string>>(new Set())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Observer für Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const itemId = (entry.target as HTMLElement).dataset.itemId
            if (itemId && !loadedItemsRef.current.has(itemId)) {
              const item = queue.find((q) => q.id === itemId)
              if (item && !item.metadata) {
                loadedItemsRef.current.add(itemId)
                onLoadMetadata(itemId, item.videoFile.path)
              }
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    // Beobachte alle Kartenelemente
    const cards = gridRef.current?.querySelectorAll('[data-item-id]')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [queue, onLoadMetadata])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedId) return

    const draggedIndex = queue.findIndex(item => item.id === draggedId)
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedId(null)
      setDragOverIndex(null)
      return
    }

    const newQueue = [...queue]
    const draggedItem = newQueue[draggedIndex]
    newQueue.splice(draggedIndex, 1)

    // Wenn wir nach unten ziehen, müssen wir den Index anpassen
    const finalTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
    newQueue.splice(finalTargetIndex, 0, draggedItem)

    onReorderQueue?.(newQueue)
    setDraggedId(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverIndex(null)
  }


  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-lg font-medium">Keine Videos in der Warteschlange</p>
        <p className="text-sm">Wähle Videos aus der Dateiliste aus</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header mit Clear All Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Warteschlange ({queue.length})
        </h3>
        {queue.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200 transition-all"
          >
            <Trash2 size={14} />
            Alle löschen
          </button>
        )}
      </div>

      {/* Video List - Kompakt Minimal Design */}
      <div
        ref={gridRef}
        className="flex-1 overflow-y-auto pr-2 space-y-2"
      >
        {queue.map((item, index) => (
          <div key={item.id}>
            {/* Drop-Indikator oben */}
            {dragOverIndex === index && draggedId && (
              <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-1 rounded" />
            )}

            {/* Video Zeile */}
            <div
              data-item-id={item.id}
              draggable={item.status !== 'processing'}
              onDragStart={(e) => {
                if (item.status !== 'processing') {
                  handleDragStart(e, item.id)
                }
              }}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`backdrop-blur-sm rounded-lg border transition-all duration-150 ${
                draggedId === item.id
                  ? 'p-3 opacity-40 bg-slate-600/20 border-slate-300/40 shadow-xl scale-95'
                  : dragOverIndex === index
                    ? 'p-3 bg-gradient-to-r from-blue-500/20 to-blue-400/10 border-blue-500/80 border-2 shadow-lg shadow-blue-500/30'
                    : item.status === 'completed'
                      ? 'p-3 bg-emerald-500/5 border-emerald-500/30'
                      : item.status === 'processing'
                        ? 'p-3 bg-blue-500/8 border-blue-500/40'
                        : item.status === 'error'
                          ? 'p-3 bg-red-500/5 border-red-500/30'
                          : 'p-3 bg-slate-500/5 border-slate-400/20 hover:border-slate-400/30'
              } ${item.status !== 'processing' ? 'cursor-move' : 'cursor-not-allowed'}`}
            >
              <div className="flex items-center gap-3 w-full">
            {/* Grip Handle + Delete Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Grip Handle */}
              {item.status !== 'processing' && (
                <div
                  className="p-1 rounded hover:bg-blue-500/20 transition-colors cursor-grab active:cursor-grabbing"
                  title="Zum Verschieben ziehen"
                >
                  <GripVertical size={16} className="text-blue-400" />
                </div>
              )}

              {/* Delete Button */}
              {item.status !== 'processing' && (
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 rounded hover:bg-red-500/20 transition-colors"
                  title="Löschen"
                >
                  <X size={14} className="text-red-400 hover:text-red-300" />
                </button>
              )}
            </div>

            {/* Video Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate" title={item.videoFile.name}>
                {item.videoFile.name}
              </p>
            </div>

            {/* Größe */}
            <div className="flex-shrink-0">
              <p className="text-xs text-slate-400">{formatSize(item.videoFile.size)}</p>
            </div>

            {/* Auflösung */}
            <div className="flex-shrink-0 min-w-20">
              <p className="text-xs text-slate-300 text-right">
                {item.metadata?.resolution ? (
                  item.metadata.resolution
                ) : (
                  <span className="text-slate-500 italic">–</span>
                )}
              </p>
            </div>

            {/* Format */}
            <div className="flex-shrink-0 min-w-20">
              <p className="text-xs text-slate-300 text-right">
                {item.metadata?.format ? (
                  item.metadata.format.slice(0, 4)
                ) : (
                  <span className="text-slate-500 italic">–</span>
                )}
              </p>
            </div>

            {/* Status Badge */}
            <div
              className={`flex-shrink-0 ml-auto text-xs px-3 py-1.5 rounded-md font-semibold whitespace-nowrap flex items-center gap-1.5 ${
                item.status === 'completed'
                  ? 'bg-emerald-500/30 text-emerald-100'
                  : item.status === 'processing'
                    ? 'bg-blue-500/40 text-blue-100'
                    : item.status === 'error'
                      ? 'bg-red-500/40 text-red-100'
                      : 'bg-slate-500/30 text-slate-100'
              }`}
            >
              <span>{item.status === 'completed' ? '✓' : item.status === 'processing' ? '⟳' : item.status === 'error' ? '✕' : '○'}</span>
              <span>
                {item.status === 'completed' ? 'Fertig' : item.status === 'processing' ? 'Läuft' : item.status === 'error' ? 'Fehler' : 'Wartet'}
              </span>
            </div>
              </div>

              {/* Progress Bar - nur bei processing mit progress data */}
              {item.status === 'processing' && item.progress && (
                <div className="mt-2 pt-2 border-t border-blue-500/20">
                  <div className="flex items-center gap-3">
                    {/* Progress Bar */}
                    <div className="flex-1">
                      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
                          style={{ width: `${item.progress.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-blue-300 font-semibold min-w-[3rem] text-right">
                        {item.progress.percentage}%
                      </span>
                      <span className="text-slate-400">
                        {item.progress.currentTime}/{item.progress.totalTime}
                      </span>
                      <span className="text-slate-500">
                        {item.progress.fps} fps
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
