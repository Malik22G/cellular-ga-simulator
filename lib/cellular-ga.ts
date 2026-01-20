export class SeededRandom {
  private seed: number

  constructor(seed: number = 12345) {
    this.seed = seed
  }

  random(): number {
    const x = Math.sin(this.seed++) * 10000
    return x - Math.floor(x)
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  choice<T>(arr: T[]): T {
    return arr[this.randomInt(0, arr.length - 1)]
  }
}

export class Individual {
  genomeLength: number
  genome: number[]
  fitness: number | null

  constructor(genomeLength: number, rng: SeededRandom) {
    this.genomeLength = genomeLength
    this.genome = new Array(genomeLength)
    // Bias towards 1s (70-90% ones) so initial fitness is bad for minimization
    const onesProbability = 0.7 + rng.random() * 0.2
    for (let i = 0; i < genomeLength; i++) {
      this.genome[i] = rng.random() < onesProbability ? 1 : 0
    }
    this.fitness = null
  }

  copy(): Individual {
    const ind = Object.create(Individual.prototype)
    ind.genomeLength = this.genomeLength
    ind.genome = [...this.genome]
    ind.fitness = this.fitness
    return ind
  }

  toReal(): number {
    let value = 0
    for (let i = 0; i < this.genome.length; i++) {
      value += this.genome[i] * Math.pow(2, -(i + 1))
    }
    return value
  }
}

// FITNESS FUNCTIONS (ALL MINIMIZATION) 
export const FitnessFunctions: Record<string, (individual: Individual) => number> = {
  onemax: (individual: Individual) => {
    return individual.genome.reduce((sum, bit) => sum + bit, 0)
  },

  trap: (individual: Individual) => {
    const ones = individual.genome.reduce((sum, bit) => sum + bit, 0)
    const n = individual.genome.length

    if (ones === 0) return 0
    if (ones === n) return 1
    return n - ones + 1
  },

  sphere: (individual: Individual) => {
    const real = individual.toReal()
    const x = (real - 0.5) * 2
    return x * x
  },

  rastrigin: (individual: Individual) => {
    const A = 10
    const real = individual.toReal()
    const x = (real - 0.5) * 10.24
    return A + (x * x - A * Math.cos(2 * Math.PI * x))
  },
}

export interface Position {
  x: number
  y: number
}

export interface CanvasDimensions {
  width: number
  height: number
}

export class TopologyManager {
  popSize: number
  topology: string
  rewiringProb: number
  rng: SeededRandom
  positions: Position[]
  neighbors: number[][]
  canvasDimensions: CanvasDimensions

  constructor(
    popSize: number,
    topology: string,
    rewiringProb: number,
    rng: SeededRandom,
    canvasDimensions: CanvasDimensions = { width: 800, height: 500 }
  ) {
    this.popSize = popSize
    this.topology = topology
    this.rewiringProb = rewiringProb
    this.rng = rng
    this.canvasDimensions = canvasDimensions
    this.positions = []
    this.neighbors = this.buildTopology()
  }

  buildTopology(): number[][] {
    switch (this.topology) {
      case "ring":
        return this.buildRing()
      case "grid":
        return this.buildGrid()
      case "smallworld":
        return this.buildSmallWorld()
      default:
        return this.buildGrid()
    }
  }

  buildRing(): number[][] {
    const neighbors: number[][] = []
    this.positions = []

    const { width, height } = this.canvasDimensions
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.4

    for (let i = 0; i < this.popSize; i++) {
      const angle = (i / this.popSize) * 2 * Math.PI - Math.PI / 2
      this.positions[i] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }

      const left = (i - 1 + this.popSize) % this.popSize
      const right = (i + 1) % this.popSize
      neighbors[i] = [left, right]
    }
    return neighbors
  }

  buildGrid(): number[][] {
    const gridSize = Math.ceil(Math.sqrt(this.popSize))
    const neighbors: number[][] = []
    this.positions = []

    const { width, height } = this.canvasDimensions
    const padding = 30
    const availableWidth = width - padding * 2
    const availableHeight = height - padding * 2
    const cellSize = Math.min(availableWidth / gridSize, availableHeight / gridSize)
    const totalGridWidth = cellSize * gridSize
    const totalGridHeight = cellSize * gridSize
    const offsetX = (width - totalGridWidth) / 2
    const offsetY = (height - totalGridHeight) / 2

    for (let i = 0; i < this.popSize; i++) {
      const row = Math.floor(i / gridSize)
      const col = i % gridSize

      this.positions[i] = {
        x: offsetX + col * cellSize + cellSize / 2,
        y: offsetY + row * cellSize + cellSize / 2,
      }

      const n: number[] = []
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue

          const newRow = (row + dr + gridSize) % gridSize
          const newCol = (col + dc + gridSize) % gridSize
          const idx = newRow * gridSize + newCol

          if (idx < this.popSize) {
            n.push(idx)
          }
        }
      }
      neighbors[i] = n
    }
    return neighbors
  }

  buildSmallWorld(): number[][] {
    const neighbors = this.buildRing()
    const rewired = neighbors.map((n) => [...n])

    for (let i = 0; i < this.popSize; i++) {
      for (let j = 0; j < rewired[i].length; j++) {
        if (this.rng.random() < this.rewiringProb) {
          let newNeighbor: number
          do {
            newNeighbor = this.rng.randomInt(0, this.popSize - 1)
          } while (newNeighbor === i || rewired[i].includes(newNeighbor))

          rewired[i][j] = newNeighbor
        }
      }
    }
    return rewired
  }

  getNeighbors(index: number): number[] {
    return this.neighbors[index] || []
  }

  getPosition(index: number): Position {
    return this.positions[index] || { x: 0, y: 0 }
  }
}

export interface GAConfig {
  popSize: number
  genomeLength: number
  mutationRate: number
  crossoverRate: number
  rewiringProb: number
  topology: string
  fitnessFunction: string
  seed: number
}

export class CellularGA {
  config: GAConfig
  rng: SeededRandom
  generation: number
  population: Individual[]
  history: { best: number[]; avg: number[] }
  topologyManager: TopologyManager

  constructor(config: GAConfig, canvasDimensions?: CanvasDimensions) {
    this.config = config
    this.rng = new SeededRandom(config.seed)
    this.generation = 0
    this.population = []
    this.history = {
      best: [],
      avg: [],
    }

    this.initPopulation()
    this.topologyManager = new TopologyManager(
      config.popSize,
      config.topology,
      config.rewiringProb,
      this.rng,
      canvasDimensions
    )
  }

  initPopulation(): void {
    this.population = []
    for (let i = 0; i < this.config.popSize; i++) {
      const ind = new Individual(this.config.genomeLength, this.rng)
      ind.fitness = this.evaluateFitness(ind)
      this.population.push(ind)
    }
  }

  evaluateFitness(individual: Individual): number {
    const fitnessFunc = FitnessFunctions[this.config.fitnessFunction]
    return fitnessFunc(individual)
  }

  // Slower selection: pick 2 random neighbors instead of always best
  tournamentSelection(indices: number[]): Individual {
    const a = this.population[this.rng.choice(indices)]
    const b = this.population[this.rng.choice(indices)]
    return (a.fitness! < b.fitness! ? a : b).copy()
  }

  uniformCrossover(parent1: Individual, parent2: Individual): Individual {
    const child = new Individual(this.config.genomeLength, this.rng)
    const cut = this.rng.randomInt(1, this.config.genomeLength - 1)

    for (let i = 0; i < this.config.genomeLength; i++) {
      child.genome[i] = i < cut
        ? parent1.genome[i]
        : parent2.genome[i]
    }

    return child
  }

  mutate(individual: Individual): void {
    for (let i = 0; i < individual.genome.length; i++) {
      if (this.rng.random() < this.config.mutationRate) {
        individual.genome[i] = 1 - individual.genome[i]
      }
    }
  }

  evolve(): void {
    if (this.config.mutationRate === 0 && this.config.crossoverRate === 0) {
      this.generation++
      this.updateHistory()
      return
    }

    const newPopulation: Individual[] = []

    for (let i = 0; i < this.config.popSize; i++) {
      const neighbors = this.topologyManager.getNeighbors(i)
      neighbors.push(i)

      const parent1 = this.tournamentSelection(neighbors)
      const parent2 = this.tournamentSelection(neighbors)

      let offspring: Individual
      if (this.rng.random() < this.config.crossoverRate) {
        offspring = this.uniformCrossover(parent1, parent2)
      } else {
        offspring = parent1.copy()
      }

      this.mutate(offspring)
      offspring.fitness = this.evaluateFitness(offspring)

      // Replace only with 50% probability even if offspring is better (good for slow convergence)
      if (offspring.fitness! < this.population[i].fitness! &&
          this.rng.random() < 0.5) {
        newPopulation[i] = offspring
      } else {
        newPopulation[i] = this.population[i]
      }
    }

    this.population = newPopulation
    this.generation++
    this.updateHistory()
  }

  updateHistory(): void {
    const fitnesses = this.population.map((ind) => ind.fitness!)
    const best = Math.min(...fitnesses)
    const avg = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length

    this.history.best.push(best)
    this.history.avg.push(avg)

    if (this.history.best.length > 300) {
      this.history.best.shift()
      this.history.avg.shift()
    }
  }

  getBestIndividual(): Individual {
    return this.population.reduce((best, ind) => (ind.fitness! < best.fitness! ? ind : best))
  }

  getStats(): { best: number; avg: number; diversity: number } {
    const fitnesses = this.population.map((ind) => ind.fitness!)
    const best = Math.min(...fitnesses)
    const avg = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length
    const variance = fitnesses.reduce((sum, f) => sum + Math.pow(f - avg, 2), 0) / fitnesses.length
    const diversity = Math.sqrt(variance)

    return { best, avg, diversity }
  }
}
