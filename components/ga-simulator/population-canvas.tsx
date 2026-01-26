"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import type { CellularGA } from "@/lib/cellular-ga"

interface PopulationCanvasProps {
  ga: CellularGA | null
  showConnections: boolean
  width: number
  height: number
}

function fitnessToColor(normalized: number): string {
  // color palette: green -> yellow -> orange -> red
  if (normalized > 0.75) {
    const t = (normalized - 0.75) * 4
    return `hsl(${145 + t * 15}, ${65 + t * 15}%, ${40 + t * 15}%)`
  } else if (normalized > 0.5) {
    const t = (normalized - 0.5) * 4
    return `hsl(${80 + (1 - t) * 65}, 70%, 45%)`
  } else if (normalized > 0.25) {
    const t = (normalized - 0.25) * 4
    return `hsl(${30 + t * 50}, 75%, ${40 + t * 5}%)`
  } else {
    const t = normalized * 4
    return `hsl(${0 + t * 30}, ${65 + t * 10}%, ${30 + t * 10}%)`
  }
}

export function PopulationCanvas({ ga, showConnections, width, height }: PopulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!ga) return

const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

// Use actual canvas dimensions (which change in fullscreen)
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // Calculate scale factors for fullscreen mode
    const scaleX = canvasWidth / width
    const scaleY = canvasHeight / height

    // Light background
    ctx.fillStyle = "#fafaf9"
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    const fitnesses = ga.population.map((ind) => ind.fitness!)
    const minFit = Math.min(...fitnesses)
    const maxFit = Math.max(...fitnesses)
    const range = maxFit - minFit || 1

    // Draw connections first (if enabled)
    if (showConnections) {
      ctx.strokeStyle = "rgba(168, 162, 158, 0.25)"
      ctx.lineWidth = Math.max(1, Math.min(scaleX, scaleY))

      for (let i = 0; i < ga.config.popSize; i++) {
        const pos1 = ga.topologyManager.getPosition(i)
        const neighbors = ga.topologyManager.getNeighbors(i)

        for (const n of neighbors) {
          if (n > i) {
            const pos2 = ga.topologyManager.getPosition(n)
            ctx.beginPath()
            ctx.moveTo(pos1.x * scaleX, pos1.y * scaleY)
            ctx.lineTo(pos2.x * scaleX, pos2.y * scaleY)
            ctx.stroke()
          }
        }
      }
    }
    
    const sorted = [...fitnesses].sort((a, b) => a - b)
    const percentiles = fitnesses.map(f => sorted.findIndex(v => v >= f) / (fitnesses.length - 1))

    // Calculate node size based on population and canvas (scales with fullscreen)
    const gridSize = Math.ceil(Math.sqrt(ga.config.popSize))
    const baseNodeSize = ga.config.topology === "grid" 
      ? Math.max(3, Math.min(10, Math.min(width, height) / gridSize * 0.35)) 
      : Math.max(4, Math.min(7, 350 / Math.sqrt(ga.config.popSize)))
    const nodeSize = baseNodeSize * Math.min(scaleX, scaleY)

    for (let i = 0; i < ga.config.popSize; i++) {
      const pos = ga.topologyManager.getPosition(i)
      const fitness = ga.population[i].fitness!

      // Scale position to current canvas size
      const scaledX = pos.x * scaleX
      const scaledY = pos.y * scaleY
     
      const normalized = 1 - percentiles[i] 
      const color = fitnessToColor(normalized)

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(scaledX, scaledY, nodeSize, 0, 2 * Math.PI)
      ctx.fill()

      // Highlight best individual with ring
      if (fitness === minFit) {
        ctx.strokeStyle = "#10b981"
        ctx.lineWidth = 2 * Math.min(scaleX, scaleY)
        ctx.beginPath()
        ctx.arc(scaledX, scaledY, nodeSize + 3 * Math.min(scaleX, scaleY), 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
  }, [ga, showConnections, width, height, isFullscreen])

return (
    <div 
      ref={containerRef}
      className={`rounded-lg border border-stone-200 bg-white p-5 ${isFullscreen ? "flex flex-col" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-stone-800">Population Fitness Landscape</h3>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={isFullscreen ? window.innerWidth - 40 : width}
        height={isFullscreen ? window.innerHeight - 140 : height}
        className={`mx-auto block rounded border border-stone-100 ${isFullscreen ? "flex-1" : ""}`}
      />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded" style={{ background: "hsl(160, 80%, 50%)" }} />
          <span className="text-stone-500">Optimal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded" style={{ background: "hsl(80, 70%, 45%)" }} />
          <span className="text-stone-500">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded" style={{ background: "hsl(40, 75%, 45%)" }} />
          <span className="text-stone-500">Poor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded" style={{ background: "hsl(5, 70%, 35%)" }} />
          <span className="text-stone-500">Worst</span>
        </div>
      </div>
    </div>
  )
}
