"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import type { CellularGA } from "@/lib/cellular-ga"

Chart.register(...registerables)

interface FitnessChartProps {
  ga: CellularGA | null
}

export function FitnessChart({ ga }: FitnessChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Best Fitness",
            data: [],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0,
            fill: true,
          },
          {
            label: "Average Fitness",
            data: [],
            borderColor: "#a8a29e",
            backgroundColor: "rgba(168, 162, 158, 0.05)",
            borderWidth: 1.5,
            tension: 0.3,
            pointRadius: 0,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: {
            beginAtZero: true,
            reverse: false,
            title: {
              display: true,
              text: "Fitness (Lower = Better)",
              color: "#78716c",
              font: { size: 12 },
            },
            ticks: { color: "#a8a29e" },
            grid: { color: "rgba(214, 211, 209, 0.5)" },
          },
          x: {
            title: {
              display: true,
              text: "Generation",
              color: "#78716c",
              font: { size: 12 },
            },
            ticks: { color: "#a8a29e" },
            grid: { color: "rgba(214, 211, 209, 0.3)" },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: { color: "#57534e", usePointStyle: true, pointStyle: "line" },
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!ga || !chartRef.current) return

    const labels = ga.history.best.map((_, i) => ga.generation - ga.history.best.length + i + 1)

    chartRef.current.data.labels = labels
    chartRef.current.data.datasets[0].data = ga.history.best
    chartRef.current.data.datasets[1].data = ga.history.avg
    chartRef.current.update("none")
  }, [ga, ga?.generation])

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <h3 className="mb-4 font-medium text-stone-800">Fitness Evolution</h3>
      <div className="h-64">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
