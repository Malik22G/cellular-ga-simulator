"use client"

import { useEffect, useRef } from "react"
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

  useEffect(() => {
    if (!ga) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Light background
    ctx.fillStyle = "#fafaf9"
    ctx.fillRect(0, 0, width, height)

    const fitnesses = ga.population.map((ind) => ind.fitness!)
    const minFit = Math.min(...fitnesses)
    const maxFit = Math.max(...fitnesses)
    const range = maxFit - minFit || 1

    // Draw connections first (if enabled)
    if (showConnections) {
      ctx.strokeStyle = "rgba(168, 162, 158, 0.25)"
      ctx.lineWidth = 1

      for (let i = 0; i < ga.config.popSize; i++) {
        const pos1 = ga.topologyManager.getPosition(i)
        const neighbors = ga.topologyManager.getNeighbors(i)

        for (const n of neighbors) {
          if (n > i) {
            const pos2 = ga.topologyManager.getPosition(n)
            ctx.beginPath()
            ctx.moveTo(pos1.x, pos1.y)
            ctx.lineTo(pos2.x, pos2.y)
            ctx.stroke()
          }
        }
      }
    }

    // Calculate node size based on population and canvas
    const gridSize = Math.ceil(Math.sqrt(ga.config.popSize))
    const nodeSize = ga.config.topology === "grid" 
      ? Math.max(3, Math.min(10, Math.min(width, height) / gridSize * 0.35)) 
      : Math.max(4, Math.min(7, 350 / Math.sqrt(ga.config.popSize)))

    for (let i = 0; i < ga.config.popSize; i++) {
      const pos = ga.topologyManager.getPosition(i)
      const fitness = ga.population[i].fitness!

      const normalized = 1 - (fitness - minFit) / range
      const color = fitnessToColor(normalized)

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, nodeSize, 0, 2 * Math.PI)
      ctx.fill()

      // Highlight best individual with ring
      if (fitness === minFit) {
        ctx.strokeStyle = "#10b981"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, nodeSize + 3, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
  }, [ga, showConnections, width, height])

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <h3 className="mb-4 font-medium text-stone-800">Population Fitness Landscape</h3>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="mx-auto block rounded border border-stone-100"
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
