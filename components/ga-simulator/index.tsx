"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CellularGA, type GAConfig } from "@/lib/cellular-ga"
import { Controls } from "./controls"
import { PopulationCanvas } from "./population-canvas"
import { FitnessChart } from "./fitness-chart"
import { StatsDisplay } from "./stats-display"

const CANVAS_WIDTH = 700
const CANVAS_HEIGHT = 500

const defaultConfig: GAConfig = {
  popSize: 400,
  genomeLength: 20,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  rewiringProb: 0.1,
  topology: "grid",
  fitnessFunction: "onemax",
  seed: Date.now(),
}

export function GASimulator() {
  const [config, setConfig] = useState<GAConfig>(defaultConfig)
  const [ga, setGA] = useState<CellularGA | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showConnections, setShowConnections] = useState(false)
  const [speed, setSpeed] = useState(30)
  const [stats, setStats] = useState({ generation: 0, best: 0, avg: 0, diversity: 0 })

  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const gaRef = useRef<CellularGA | null>(null)
  const speedRef = useRef(speed)

  // Keep speedRef in sync with speed state
  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  const initGA = useCallback((newConfig: GAConfig) => {
    const newGA = new CellularGA(
      { ...newConfig, seed: Date.now() },
      { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
    )
    gaRef.current = newGA
    setGA(newGA)
    const gaStats = newGA.getStats()
    setStats({
      generation: newGA.generation,
      best: gaStats.best,
      avg: gaStats.avg,
      diversity: gaStats.diversity,
    })
  }, [])

  useEffect(() => {
    initGA(config)
  }, []) 

  const stopAnimation = useCallback(() => {
    setIsRunning(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const animate = useCallback((timestamp: number) => {
    if (!gaRef.current) return

    const interval = 1000 / speedRef.current

    if (timestamp - lastFrameTimeRef.current >= interval) {
      gaRef.current.evolve()
      const gaStats = gaRef.current.getStats()
      setStats({
        generation: gaRef.current.generation,
        best: gaStats.best,
        avg: gaStats.avg,
        diversity: gaStats.diversity,
      })
      setGA({ ...gaRef.current } as CellularGA)
      lastFrameTimeRef.current = timestamp
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [])

  const handleStart = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    lastFrameTimeRef.current = 0
    animationRef.current = requestAnimationFrame(animate)
  }, [isRunning, animate])

  const handlePause = useCallback(() => {
    stopAnimation()
  }, [stopAnimation])

  const handleReset = useCallback(() => {
    stopAnimation()
    initGA(config)
  }, [stopAnimation, initGA, config])

  const handleConfigChange = useCallback((key: keyof GAConfig, value: number | string) => {
    setConfig((prev) => {
      const newConfig = { ...prev, [key]: value }
      // Stop animation and reinitialize with new config
      stopAnimation()
      // Use setTimeout to ensure state is updated before reinit
      setTimeout(() => {
        initGA(newConfig)
      }, 0)
      return newConfig
    })
  }, [stopAnimation, initGA])

  // Handle speed change separately - doesn't stop the algorithm
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    // speedRef is updated via useEffect, animation loop will use new speed
  }, [])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
            Cellular Genetic Algorithm
          </h1>
          <p className="mt-1 text-stone-500">Topology-Based Minimization Simulator</p>
        </header>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Controls Panel */}
          <Controls
            config={config}
            onConfigChange={handleConfigChange}
            isRunning={isRunning}
            showConnections={showConnections}
            onShowConnectionsChange={setShowConnections}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={handleSpeedChange}
          />

          {/* Visualization Panel */}
          <div className="space-y-6">
            <PopulationCanvas
              ga={ga}
              showConnections={showConnections}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />

            <StatsDisplay
              generation={stats.generation}
              bestFitness={stats.best}
              avgFitness={stats.avg}
              diversity={stats.diversity}
            />

            <FitnessChart ga={ga} />

            {/* Info Box */}
            <div className="rounded-lg border border-stone-200 bg-white p-5">
              <h4 className="mb-2 font-medium text-stone-800">Understanding Minimization</h4>
              <p className="text-sm leading-relaxed text-stone-600">
                In this simulation, <span className="font-medium text-emerald-600">fitness = 0 is optimal</span>. Lower values are better.
                Green indicates individuals close to the optimum, while orange/red shows poor solutions.
                Watch how different topologies affect the speed and pattern of fitness reduction across
                the population.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
