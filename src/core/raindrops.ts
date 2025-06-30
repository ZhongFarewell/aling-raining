import loadImages from "./image-loader.js"
import times from "./times"
import createCanvas from "./create-canvas"
import { random, chance } from "./random"

const dropSize = 64

export interface Drop {
  x: number
  y: number
  r: number
  spreadX: number
  spreadY: number
  momentum: number
  momentumX: number
  lastSpawn: number
  nextSpawn: number
  parent: Drop | null
  isNew: boolean
  killed: boolean
  shrink: number
}

export interface RaindropsOptions {
  minR: number
  maxR: number
  maxDrops: number
  rainChance: number
  rainLimit: number
  dropletsRate: number
  dropletsSize: [number, number]
  dropletsCleaningRadiusMultiplier: number
  raining: boolean
  globalTimeScale: number
  trailRate: number
  autoShrink: boolean
  spawnArea: [number, number]
  trailScaleRange: [number, number]
  collisionRadius: number
  collisionRadiusIncrease: number
  dropFallMultiplier: number
  collisionBoostMultiplier: number
  collisionBoost: number
}

const defaultOptions: RaindropsOptions = {
  minR: 10,
  maxR: 40,
  maxDrops: 900,
  rainChance: 0.3,
  rainLimit: 3,
  dropletsRate: 50,
  dropletsSize: [2, 4],
  dropletsCleaningRadiusMultiplier: 0.43,
  raining: true,
  globalTimeScale: 1,
  trailRate: 1,
  autoShrink: true,
  spawnArea: [-0.1, 0.95],
  trailScaleRange: [0.2, 0.5],
  collisionRadius: 0.65,
  collisionRadiusIncrease: 0.01,
  dropFallMultiplier: 1,
  collisionBoostMultiplier: 0.05,
  collisionBoost: 1,
}

export default class Raindrops {
  dropColor: HTMLImageElement
  dropAlpha: HTMLImageElement
  canvas: HTMLCanvasElement | null = null
  ctx: CanvasRenderingContext2D | null = null
  width: number
  height: number
  scale: number
  dropletsPixelDensity: number = 1
  droplets: HTMLCanvasElement | null = null
  dropletsCtx: CanvasRenderingContext2D | null = null
  dropletsCounter: number = 0
  drops: Drop[] = []
  dropsGfx: HTMLCanvasElement[] = []
  clearDropletsGfx: HTMLCanvasElement | null = null
  textureCleaningIterations: number = 0
  lastRender: number | null = null
  animationId: number | null = null
  isRunning: boolean = false
  options: RaindropsOptions

  constructor(
    width: number,
    height: number,
    scale: number,
    dropAlpha: HTMLImageElement,
    dropColor: HTMLImageElement,
    options: Partial<RaindropsOptions> = {}
  ) {
    this.width = width
    this.height = height
    this.scale = scale
    this.dropAlpha = dropAlpha
    this.dropColor = dropColor
    this.options = { ...defaultOptions, ...options }
    this.init()
  }

  get deltaR() {
    return this.options.maxR - this.options.minR
  }
  get area() {
    return (this.width * this.height) / this.scale
  }
  get areaMultiplier() {
    return Math.sqrt(this.area / (1024 * 768))
  }

  init() {
    this.canvas = createCanvas(this.width, this.height)
    this.ctx = this.canvas.getContext("2d")
    this.droplets = createCanvas(
      this.width * this.dropletsPixelDensity,
      this.height * this.dropletsPixelDensity
    )
    this.dropletsCtx = this.droplets.getContext("2d")
    this.drops = []
    this.dropsGfx = []
    this.renderDropsGfx()
    this.startAnimation()
  }

  drawDroplet(x: number, y: number, r: number) {
    this.drawDrop(
      this.dropletsCtx!,
      Object.assign(
        Object.create({
          x: 0,
          y: 0,
          r: 0,
          spreadX: 0,
          spreadY: 0,
          momentum: 0,
          momentumX: 0,
          lastSpawn: 0,
          nextSpawn: 0,
          parent: null,
          isNew: true,
          killed: false,
          shrink: 0,
        }),
        {
          x: x * this.dropletsPixelDensity,
          y: y * this.dropletsPixelDensity,
          r: r * this.dropletsPixelDensity,
        }
      ) as Drop
    )
  }

  reload() {
    // ...可选实现...
  }

  startAnimation() {
    if (!this.isRunning) {
      this.isRunning = true
      this.lastRender = null
      this.update()
    }
  }

  abort() {
    this.pauseAnimation()
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.width, this.height)
    }
    if (this.dropletsCtx && this.droplets) {
      this.dropletsCtx.clearRect(
        0,
        0,
        this.width * this.dropletsPixelDensity,
        this.height * this.dropletsPixelDensity
      )
    }
    if (this.drops) this.drops.length = 0
    if (this.dropsGfx) this.dropsGfx.length = 0
    if (this.clearDropletsGfx) this.clearDropletsGfx = null
    this.dropletsCounter = 0
    this.textureCleaningIterations = 0
    this.lastRender = null
    this.ctx = null
    this.canvas = null
    this.dropletsCtx = null
    this.droplets = null
  }

  renderDropsGfx() {
    const dropBuffer = createCanvas(dropSize, dropSize)
    const dropBufferCtx = dropBuffer.getContext("2d")!
    this.dropsGfx = Array.from({ length: 255 }).map((_, i) => {
      const drop = createCanvas(dropSize, dropSize)
      const dropCtx = drop.getContext("2d")!
      dropBufferCtx.clearRect(0, 0, dropSize, dropSize)
      dropBufferCtx.globalCompositeOperation = "source-over"
      dropBufferCtx.drawImage(this.dropColor, 0, 0, dropSize, dropSize)
      dropBufferCtx.globalCompositeOperation = "screen"
      dropBufferCtx.fillStyle = `rgba(0,0,${i},1)`
      dropBufferCtx.fillRect(0, 0, dropSize, dropSize)
      dropCtx.globalCompositeOperation = "source-over"
      dropCtx.drawImage(this.dropAlpha, 0, 0, dropSize, dropSize)
      dropCtx.globalCompositeOperation = "source-in"
      dropCtx.drawImage(dropBuffer, 0, 0, dropSize, dropSize)
      return drop
    })
    this.clearDropletsGfx = createCanvas(128, 128)
    const clearDropletsCtx = this.clearDropletsGfx.getContext("2d")!
    clearDropletsCtx.fillStyle = "#000"
    clearDropletsCtx.beginPath()
    clearDropletsCtx.arc(64, 64, 64, 0, Math.PI * 2)
    clearDropletsCtx.fill()
  }

  drawDrop(ctx: CanvasRenderingContext2D, drop: Drop) {
    if (this.dropsGfx.length > 0) {
      const x = drop.x
      const y = drop.y
      const r = drop.r
      const spreadX = drop.spreadX
      const spreadY = drop.spreadY
      let scaleX = 1
      let scaleY = 1.5
      let d = Math.max(0, Math.min(1, ((r - this.options.minR) / this.deltaR) * 0.9))
      d *= 1 / ((drop.spreadX + drop.spreadY) * 0.5 + 1)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      d = Math.floor(d * (this.dropsGfx.length - 1))
      ctx.drawImage(
        this.dropsGfx[d],
        (x - r * scaleX * (spreadX + 1)) * this.scale,
        (y - r * scaleY * (spreadY + 1)) * this.scale,
        r * 2 * scaleX * (spreadX + 1) * this.scale,
        r * 2 * scaleY * (spreadY + 1) * this.scale
      )
    }
  }

  clearDroplets(x: number, y: number, r: number = 30) {
    const ctx = this.dropletsCtx!
    ctx.globalCompositeOperation = "destination-out"
    ctx.drawImage(
      this.clearDropletsGfx!,
      (x - r) * this.dropletsPixelDensity * this.scale,
      (y - r) * this.dropletsPixelDensity * this.scale,
      r * 2 * this.dropletsPixelDensity * this.scale,
      r * 2 * this.dropletsPixelDensity * this.scale * 1.5
    )
  }

  clearCanvas() {
    this.ctx!.clearRect(0, 0, this.width, this.height)
  }

  createDrop(options: Partial<Drop>): Drop | null {
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier) return null
    return Object.assign(
      Object.create({
        x: 0,
        y: 0,
        r: 0,
        spreadX: 0,
        spreadY: 0,
        momentum: 0,
        momentumX: 0,
        lastSpawn: 0,
        nextSpawn: 0,
        parent: null,
        isNew: true,
        killed: false,
        shrink: 0,
      }),
      options
    ) as Drop
  }

  addDrop(drop: Drop | null): boolean {
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier || drop == null)
      return false
    this.drops.push(drop)
    return true
  }

  updateRain(timeScale: number): Drop[] {
    const rainDrops: Drop[] = []
    if (this.options.raining) {
      const limit = this.options.rainLimit * timeScale * this.areaMultiplier
      let count = 0
      while (chance(this.options.rainChance * timeScale * this.areaMultiplier) && count < limit) {
        count++
        const r = random(this.options.minR, this.options.maxR, (n: number) => Math.pow(n, 3))
        const rainDrop = this.createDrop({
          x: random(this.width / this.scale),
          y: random(
            (this.height / this.scale) * this.options.spawnArea[0],
            (this.height / this.scale) * this.options.spawnArea[1]
          ),
          r: r,
          momentum: 1 + (r - this.options.minR) * 0.1 + random(2),
          spreadX: 1.5,
          spreadY: 1.5,
        })
        if (rainDrop != null) {
          rainDrops.push(rainDrop)
        }
      }
    }
    return rainDrops
  }

  clearDrops() {
    this.drops.forEach((drop) => {
      setTimeout(() => {
        drop.shrink = 0.1 + random(0.5)
      }, random(1200))
    })
    this.clearTexture()
  }

  clearTexture() {
    this.textureCleaningIterations = 50
  }

  pauseAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.isRunning = false
  }

  updateDroplets(timeScale: number) {
    if (this.textureCleaningIterations > 0) {
      this.textureCleaningIterations -= 1 * timeScale
      this.dropletsCtx!.globalCompositeOperation = "destination-out"
      this.dropletsCtx!.fillStyle = `rgba(0,0,0,${0.05 * timeScale})`
      this.dropletsCtx!.fillRect(
        0,
        0,
        this.width * this.dropletsPixelDensity,
        this.height * this.dropletsPixelDensity
      )
    }
    if (this.options.raining) {
      this.dropletsCounter += this.options.dropletsRate * timeScale * this.areaMultiplier
      times(this.dropletsCounter, (i: number) => {
        this.dropletsCounter--
        this.drawDroplet(
          random(this.width / this.scale),
          random(this.height / this.scale),
          random(...this.options.dropletsSize, (n: number) => n * n)
        )
      })
    }
    this.ctx!.drawImage(this.droplets!, 0, 0, this.width, this.height)
  }

  updateDrops(timeScale: number) {
    let newDrops: Drop[] = []
    this.updateDroplets(timeScale)
    const rainDrops = this.updateRain(timeScale)
    newDrops = newDrops.concat(rainDrops)
    this.drops.sort((a, b) => {
      const va = a.y * (this.width / this.scale) + a.x
      const vb = b.y * (this.width / this.scale) + b.x
      return va > vb ? 1 : va == vb ? 0 : -1
    })
    this.drops.forEach((drop, i) => {
      if (!drop.killed) {
        if (
          chance(
            (drop.r - this.options.minR * this.options.dropFallMultiplier) *
              (0.1 / this.deltaR) *
              timeScale
          )
        ) {
          drop.momentum += random((drop.r / this.options.maxR) * 4)
        }
        if (this.options.autoShrink && drop.r <= this.options.minR && chance(0.05 * timeScale)) {
          drop.shrink += 0.01
        }
        drop.r -= drop.shrink * timeScale
        if (drop.r <= 0) drop.killed = true
        if (this.options.raining) {
          drop.lastSpawn += drop.momentum * timeScale * this.options.trailRate
          if (drop.lastSpawn > drop.nextSpawn) {
            const trailDrop = this.createDrop({
              x: drop.x + random(-drop.r, drop.r) * 0.1,
              y: drop.y - drop.r * 0.01,
              r: drop.r * random(...this.options.trailScaleRange),
              spreadY: drop.momentum * 0.1,
              parent: drop,
            })
            if (trailDrop != null) {
              newDrops.push(trailDrop)
              drop.r *= Math.pow(0.97, timeScale)
              drop.lastSpawn = 0
              drop.nextSpawn =
                random(this.options.minR, this.options.maxR) -
                drop.momentum * 2 * this.options.trailRate +
                (this.options.maxR - drop.r)
            }
          }
        }
        drop.spreadX *= Math.pow(0.4, timeScale)
        drop.spreadY *= Math.pow(0.7, timeScale)
        const moved = drop.momentum > 0
        if (moved && !drop.killed) {
          drop.y += drop.momentum * this.options.globalTimeScale
          drop.x += drop.momentumX * this.options.globalTimeScale
          if (drop.y > this.height / this.scale + drop.r) {
            drop.killed = true
          }
        }
        const checkCollision = (moved || drop.isNew) && !drop.killed
        drop.isNew = false
        if (checkCollision) {
          this.drops.slice(i + 1, i + 70).forEach((drop2) => {
            if (
              drop != drop2 &&
              drop.r > drop2.r &&
              drop.parent != drop2 &&
              drop2.parent != drop &&
              !drop2.killed
            ) {
              const dx = drop2.x - drop.x
              const dy = drop2.y - drop.y
              const d = Math.sqrt(dx * dx + dy * dy)
              if (
                d <
                (drop.r + drop2.r) *
                  (this.options.collisionRadius +
                    drop.momentum * this.options.collisionRadiusIncrease * timeScale)
              ) {
                const pi = Math.PI
                const r1 = drop.r
                const r2 = drop2.r
                const a1 = pi * (r1 * r1)
                const a2 = pi * (r2 * r2)
                let targetR = Math.sqrt((a1 + a2 * 0.8) / pi)
                if (targetR > this.options.maxR) {
                  targetR = this.options.maxR
                }
                drop.r = targetR
                drop.momentumX += dx * 0.1
                drop.spreadX = 0
                drop.spreadY = 0
                drop2.killed = true
                drop.momentum = Math.max(
                  drop2.momentum,
                  Math.min(
                    40,
                    drop.momentum +
                      targetR * this.options.collisionBoostMultiplier +
                      this.options.collisionBoost
                  )
                )
              }
            }
          })
        }
        drop.momentum -= Math.max(1, this.options.minR * 0.5 - drop.momentum) * 0.1 * timeScale
        if (drop.momentum < 0) drop.momentum = 0
        drop.momentumX *= Math.pow(0.7, timeScale)
        if (!drop.killed) {
          newDrops.push(drop)
          if (moved && this.options.dropletsRate > 0)
            this.clearDroplets(
              drop.x,
              drop.y,
              drop.r * this.options.dropletsCleaningRadiusMultiplier
            )
          this.drawDrop(this.ctx!, drop)
        }
      }
    })
    this.drops = newDrops
  }

  update() {
    this.clearCanvas()
    const now = Date.now()
    if (this.lastRender == null) this.lastRender = now
    let deltaT = now - this.lastRender
    let timeScale = deltaT / ((1 / 60) * 1000)
    if (timeScale > 1.1) timeScale = 1.1
    timeScale *= this.options.globalTimeScale
    this.lastRender = now
    this.updateDrops(timeScale)
    this.animationId = requestAnimationFrame(this.update.bind(this))
  }
}
