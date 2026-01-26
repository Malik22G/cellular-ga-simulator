"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { GAConfig } from "@/lib/cellular-ga"
import { Play, Pause, RotateCcw } from "lucide-react"

interface ControlsProps {
  config: GAConfig
  onConfigChange: (key: keyof GAConfig, value: number | string) => void
  isRunning: boolean
  showConnections: boolean
  onShowConnectionsChange: (value: boolean) => void
  onStart: () => void
  onPause: () => void
  onReset: () => void
  speed: number
  onSpeedChange: (value: number) => void
}

const topologyInfo: Record<string, string> = {
  ring: "Slowest diffusion, maximum diversity preservation",
  grid: "Balanced local diffusion, spatial waves of improvement",
  smallworld: "Fast global spread via shortcuts, local clustering",
}

export function Controls({
  config,
  onConfigChange,
  isRunning,
  showConnections,
  onShowConnectionsChange,
  onStart,
  onPause,
  onReset,
  speed,
  onSpeedChange,
}: ControlsProps) {
  return (
    <div className="space-y-6 rounded-lg border border-stone-200 bg-white p-5">
      {/* Topology Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">
          Topology
        </h3>
        <div className="space-y-2">
          <Label className="text-sm text-stone-600">Population Structure</Label>
          <Select value={config.topology} onValueChange={(v) => onConfigChange("topology", v)}>
            <SelectTrigger className="border-stone-200 bg-stone-50 text-stone-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ring">Linear Ring (1D)</SelectItem>
              <SelectItem value="grid">2D Grid (Moore)</SelectItem>
              <SelectItem value="smallworld">Small-World Network</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-stone-500">
          {topologyInfo[config.topology]}
        </p>
      </div>

      {/* Problem Section */}
      <div className="space-y-3 border-t border-stone-100 pt-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">
          Problem
        </h3>
        <div className="space-y-2">
          <Label className="text-sm text-stone-600">Fitness Function (Minimize)</Label>
          <Select
            value={config.fitnessFunction}
            onValueChange={(v) => onConfigChange("fitnessFunction", v)}
          >
            <SelectTrigger className="border-stone-200 bg-stone-50 text-stone-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onemax">OneMax</SelectItem>
              <SelectItem value="trap">Deceptive Trap</SelectItem>
              <SelectItem value="sphere">Sphere Function</SelectItem>
              <SelectItem value="rastrigin">Rastrigin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Parameters Section */}
      <div className="space-y-4 border-t border-stone-100 pt-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">
          Parameters
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-stone-600">Population</Label>
            <span className="text-sm font-medium tabular-nums text-stone-900">{config.popSize}</span>
          </div>
          <Slider
            value={[config.popSize]}
            onValueChange={([v]) => onConfigChange("popSize", v)}
            min={100}
            max={10000}
            step={10}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-stone-600">Genome Length</Label>
            <span className="text-sm font-medium tabular-nums text-stone-900">{config.genomeLength}</span>
          </div>
          <Slider
            value={[config.genomeLength]}
            onValueChange={([v]) => onConfigChange("genomeLength", v)}
            min={1}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-stone-600">Mutation Rate</Label>
            <span className="text-sm font-medium tabular-nums text-stone-900">{config.mutationRate.toFixed(2)}</span>
          </div>
          <Slider
            value={[config.mutationRate]}
            onValueChange={([v]) => onConfigChange("mutationRate", v)}
            min={0}
            max={0.5}
            step={0.05}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-stone-600">Crossover Rate</Label>
            <span className="text-sm font-medium tabular-nums text-stone-900">{config.crossoverRate.toFixed(2)}</span>
          </div>
          <Slider
            value={[config.crossoverRate]}
            onValueChange={([v]) => onConfigChange("crossoverRate", v)}
            min={0}
            max={1}
            step={0.1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-stone-600">Rewire Prob (SW)</Label>
            <span className="text-sm font-medium tabular-nums text-stone-900">{config.rewiringProb.toFixed(2)}</span>
          </div>
          <Slider
            value={[config.rewiringProb]}
            onValueChange={([v]) => onConfigChange("rewiringProb", v)}
            min={0}
            max={1}
            step={0.05}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-stone-600">Speed</Label>
            <span className="text-sm font-medium tabular-nums text-stone-900">{speed} FPS</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={([v]) => onSpeedChange(v)}
            min={1}
            max={60}
            step={1}
          />
        </div>
      </div>

      {/* Display Section */}
      <div className="space-y-3 border-t border-stone-100 pt-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">
          Display
        </h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="showConnections"
            checked={showConnections}
            onCheckedChange={(checked) => onShowConnectionsChange(checked === true)}
          />
          <Label htmlFor="showConnections" className="cursor-pointer text-sm text-stone-600">
            Show Connections
          </Label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 border-t border-stone-100 pt-5">
        <div className="flex gap-2">
          <Button
            onClick={onStart}
            disabled={isRunning}
            className="flex-1 bg-stone-900 text-white hover:bg-stone-800"
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
          <Button
            onClick={onPause}
            disabled={!isRunning}
            variant="outline"
            className="flex-1 border-stone-200 bg-transparent hover:bg-stone-50"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        </div>
        <Button
          onClick={onReset}
          variant="outline"
          className="w-full border-stone-200 bg-transparent text-stone-600 hover:bg-stone-50"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  )
}
