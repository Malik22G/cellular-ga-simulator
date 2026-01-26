import { BinaryIndividual, RealVectorIndividual } from "@/lib/cellular-ga"

interface StatsDisplayProps {
  generation: number
  bestFitness: number | null
  avgFitness: number | null
  diversity: number
  bestIndividual: BinaryIndividual | RealVectorIndividual | null

}

function formatGenome(ind: BinaryIndividual | RealVectorIndividual | null) {
  if (!ind) return "--"

  if ("genome" in ind) {
    return ind.genome.join("")
  }

  if ("x" in ind) {
    const vals = ind.x.map(v => v.toFixed(2))
    return `[${vals.join(", ")}]`
  }

  return "--"
}


export function StatsDisplay({ generation, bestFitness, avgFitness, diversity, bestIndividual }: StatsDisplayProps) {
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
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h4 className="mb-1 text-xs font-medium text-stone-400">Best Fitness</h4>
        <div className="text-2xl font-semibold tabular-nums text-stone-900">{formatValue(bestFitness)}</div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h4 className="mb-1 text-xs font-medium text-stone-400">Avg Fitness</h4>
        <div className="text-2xl font-semibold tabular-nums text-stone-900">{formatValue(avgFitness)}</div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h4 className="mb-1 text-xs font-medium text-stone-400">Diversity</h4>
        <div className="text-2xl font-semibold tabular-nums text-stone-900">{diversity?.toFixed(3) ?? "--"}</div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4 col-span-2 sm:col-span-4">
        <h4 className="mb-1 text-xs font-medium text-stone-400">
          Best Individual (Genotype)
        </h4>
        <div className="text-sm tabular-nums text-stone-900">
          {formatGenome(bestIndividual)}
        </div>
      </div>
      

    </div>
    
  )
}
