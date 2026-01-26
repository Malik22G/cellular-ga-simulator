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

export class BinaryIndividual {
  genome: number[]
  fitness: number | null = null

  constructor(length: number, rng: SeededRandom) {
    this.genome = Array.from({ length }, () =>
      rng.random() < 0.5 ? 0 : 1
    )
  }

  getGenome(): number[] {
    return this.genome
  }

  copy(): BinaryIndividual {
    const ind = Object.create(BinaryIndividual.prototype)
    ind.genome = [...this.genome]
    ind.fitness = this.fitness
    return ind
  }
}

export class RealVectorIndividual {
  x: number[]
  fitness: number | null = null

  constructor(
    dim: number,
    rng: SeededRandom,
    min = -5.12,
    max = 5.12
  ) {
    this.x = Array.from(
      { length: dim },
      () => min + rng.random() * (max - min)
    )
  }

  getGenome(): number[] {
    return this.x
  }

  copy(): RealVectorIndividual {
    const ind = Object.create(RealVectorIndividual.prototype)
    ind.x = [...this.x]
    ind.fitness = this.fitness
    return ind
  }
}


export type Individual = BinaryIndividual | RealVectorIndividual


// FITNESS FUNCTIONS (ALL MINIMIZATION) 
export const FitnessFunctions = {
  onemax: (ind: BinaryIndividual) =>
    {
      return ind.genome.length - ind.genome.reduce((s, b) => s + b, 0)
    },
  trap: (ind: BinaryIndividual) => {
    const ones = ind.genome.reduce((s, b) => s + b, 0)
    const n = ind.genome.length
    if (ones === 0) return 0
    if (ones === n) return 1
    return n - ones + 1
  },

  sphere(ind: RealVectorIndividual): number {
  return ind.x.reduce((sum, xi) => sum + xi * xi, 0)
},

  rastrigin(ind: RealVectorIndividual): number {
  const A = 10
  const d = ind.x.length

  let sum = A * d
  for (let i = 0; i < d; i++) {
    const xi = ind.x[i]
    sum += xi * xi - A * Math.cos(2 * Math.PI * xi)
  }

  return sum
}
}

function binaryCrossover(
  p1: BinaryIndividual,
  p2: BinaryIndividual,
  rng: SeededRandom
): BinaryIndividual {
  const cut = rng.randomInt(1, p1.genome.length - 1)
  const child = p1.copy()
  for (let i = cut; i < p1.genome.length; i++) {
    child.genome[i] = p2.genome[i]
  }
  return child
}

function binaryMutate(
  ind: BinaryIndividual,
  rng: SeededRandom,
  rate: number
) {
  for (let i = 0; i < ind.genome.length; i++) {
    if (rng.random() < rate) {
      ind.genome[i] = 1 - ind.genome[i]
    }
  }
}

function realVectorCrossover(
  p1: RealVectorIndividual,
  p2: RealVectorIndividual,
  rng: SeededRandom
): RealVectorIndividual {
  const child = p1.copy()

  for (let i = 0; i < child.x.length; i++) {
    const alpha= rng.random()
    child.x[i] = alpha* p1.x[i] + (1 - alpha) * p2.x[i]
  }

  return child
}


function realVectorMutate(
  ind: RealVectorIndividual,
  rng: SeededRandom,
  mutationRate: number,
  sigma = 0.1
) {
  for (let i = 0; i < ind.x.length; i++) {
    if (rng.random() < mutationRate) {
      ind.x[i] += (rng.random() - 0.5) * sigma
    }
  }
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
    const padding = 20
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
  fitnessFunction: keyof typeof FitnessFunctions
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

  isBinary(): boolean {
    return this.config.fitnessFunction === "onemax" ||
           this.config.fitnessFunction === "trap"
  }

  initPopulation(): void {
    this.population = []
    for (let i = 0; i < this.config.popSize; i++) {
      const ind = this.isBinary()
        ? new BinaryIndividual(this.config.genomeLength!, this.rng)
        : new RealVectorIndividual(this.config.genomeLength!, this.rng)
      ind.fitness = this.evaluate(ind)
      this.population.push(ind)
    }
  }

  // evaluateFitness(individual: Individual): number {
  //   const fitnessFunc = FitnessFunctions[this.config.fitnessFunction]
  //   return fitnessFunc(individual)
  // }

  evaluate(ind: Individual): number {
    return FitnessFunctions[this.config.fitnessFunction](ind as any)
  }

  // Slower selection: pick 2 random neighbors instead of always best
  tournamentSelection(indices: number[]): Individual {
    const a = this.population[this.rng.choice(indices)]
    const b = this.population[this.rng.choice(indices)]
    return (a.fitness! < b.fitness! ? a : b).copy()
  }

  // pointCrossover(parent1: Individual, parent2: Individual): Individual {
  //   const child = new Individual(this.config.genomeLength, this.rng)
  //   const cut = this.rng.randomInt(1, this.config.genomeLength - 1)

  //   for (let i = 0; i < this.config.genomeLength; i++) {
  //     child.genome[i] = i < cut
  //       ? parent1.genome[i]
  //       : parent2.genome[i]
  //   }

  //   return child
  // }

  // mutate(individual: Individual): void {
  //   for (let i = 0; i < individual.genome.length; i++) {
  //     if (this.rng.random() < this.config.mutationRate) {
  //       individual.genome[i] = 1 - individual.genome[i]
  //     }
  //   }
  // }

  evolve(): void {

    const newPopulation: Individual[] = []

    for (let i = 0; i < this.config.popSize; i++) {
      
      const neighbors = [...this.topologyManager.getNeighbors(i), i]


      const parent1 = this.tournamentSelection(neighbors)
      const parent2 = this.tournamentSelection(neighbors)

      let child: Individual
      if (this.isBinary()) {
        child = binaryCrossover(
          parent1 as BinaryIndividual,
          parent2 as BinaryIndividual,
          this.rng
        )
        binaryMutate(child as BinaryIndividual, this.rng, this.config.mutationRate)
      } else {
        child = realVectorCrossover(
          parent1 as RealVectorIndividual,
          parent2 as RealVectorIndividual,
          this.rng
        )
        realVectorMutate(child as RealVectorIndividual, this.rng, this.config.mutationRate)
      }

      child.fitness = this.evaluate(child)

      if (child.fitness! < this.population[i].fitness!) {
        newPopulation[i] = child
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
    const variance = fitnesses.reduce((sum, f) => sum + (f - avg) ** 2,0) / fitnesses.length
    let diversity = Math.sqrt(variance)
    // let count = 0

    // for (let i = 0; i < this.population.length; i++) {
    //   const neighbors = this.topologyManager.getNeighbors(i)

    //   for (const j of neighbors) {
    //     if (j <= i) continue

    //     if (this.isBinary()) {
    //       const a = (this.population[i] as BinaryIndividual).genome
    //       const b = (this.population[j] as BinaryIndividual).genome

    //       let dist = 0
    //       for (let k = 0; k < a.length; k++) {
    //         if (a[k] !== b[k]) dist++
    //       }

    //       diversity += dist
    //     } else {
    //       const a = (this.population[i] as RealVectorIndividual).x
    //       const b = (this.population[j] as RealVectorIndividual).x

    //       let sum = 0
    //       for (let k = 0; k < a.length; k++) {
    //         sum += (a[k] - b[k]) ** 2
    //       }

    //       diversity += Math.sqrt(sum)
    //     }

    //     count++
    //   }
    // }

    // diversity = count > 0 ? diversity / count : 0

    return { best, avg, diversity }
  }
}
