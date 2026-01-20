interface StatsDisplayProps {
  generation: number
  bestFitness: number | null
  avgFitness: number | null
  diversity: number
}

export function StatsDisplay({ generation, bestFitness, avgFitness, diversity }: StatsDisplayProps) {
  const formatValue = (val: number | null) => {
    if (val === null || !Number.isFinite(val)) return "--"
    return val.toFixed(3)
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h4 className="mb-1 text-xs font-medium text-stone-400">Generation</h4>
        <div className="text-2xl font-semibold tabular-nums text-stone-900">{generation}</div>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h4 className="mb-1 text-xs font-medium text-emerald-600">Best Fitness</h4>
        <div className="text-2xl font-semibold tabular-nums text-emerald-700">{formatValue(bestFitness)}</div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h4 className="mb-1 text-xs font-medium text-stone-400">Avg Fitness</h4>
        <div className="text-2xl font-semibold tabular-nums text-stone-900">{formatValue(avgFitness)}</div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h4 className="mb-1 text-xs font-medium text-stone-400">Diversity</h4>
        <div className="text-2xl font-semibold tabular-nums text-stone-900">{diversity.toFixed(3)}</div>
      </div>
    </div>
  )
}
