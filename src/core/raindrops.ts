import times from "./times.js"
import createCanvas from "./create-canvas.js"
import { random, chance } from "./random.js"

let dropSize = 64

interface Drop {
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

interface RaindropsOptions {
  minR?: number
  maxR?: number
  maxDrops?: number
  rainChance?: number
  rainLimit?: number
  dropletsRate?: number
  dropletsSize?: [number, number]
  dropletsCleaningRadiusMultiplier?: number
  raining?: boolean
  globalTimeScale?: number
  trailRate?: number
  autoShrink?: boolean
  spawnArea?: [number, number]
  trailScaleRange?: [number, number]
  collisionRadius?: number
  collisionRadiusIncrease?: number
  dropFallMultiplier?: number
  collisionBoostMultiplier?: number
  collisionBoost?: number
}

const defaultOptions: Required<RaindropsOptions> = {
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
  private dropColor: HTMLImageElement | HTMLCanvasElement
  private dropAlpha: HTMLImageElement | HTMLCanvasElement
  public canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  public width: number = 0
  public height: number = 0
  public scale: number = 0
  private dropletsPixelDensity: number = 1
  private droplets: HTMLCanvasElement | null = null
  private dropletsCtx: CanvasRenderingContext2D | null = null
  private dropletsCounter: number = 0 // 画布上水滴的数量
  private drops: Drop[] = []
  private dropsGfx: HTMLCanvasElement[] = []
  private clearDropletsGfx: HTMLCanvasElement | null = null
  private textureCleaningIterations: number = 0
  private lastRender: number | null = null
  private animationId: number | null = null
  private isRunning: boolean = false
  public options: Required<RaindropsOptions>

  constructor(
    width: number,
    height: number,
    scale: number,
    dropAlpha: HTMLImageElement | HTMLCanvasElement,
    dropColor: HTMLImageElement | HTMLCanvasElement,
    options: RaindropsOptions = {}
  ) {
    this.width = width
    this.height = height
    this.scale = scale
    this.dropAlpha = dropAlpha
    this.dropColor = dropColor
    this.options = Object.assign({}, defaultOptions, options)
    this.init()
  }

  private init(): void {
    this.canvas = createCanvas(this.width, this.height)
    this.ctx = this.canvas.getContext("2d")

    this.droplets = createCanvas(
      this.width * this.dropletsPixelDensity,
      this.height * this.dropletsPixelDensity
    )
    this.dropletsCtx = this.droplets.getContext("2d")

    // 水滴对象的集合
    this.drops = []
    // 水滴的样式集合
    this.dropsGfx = []

    this.renderDropsGfx()
    this.startAnimation()
  }

  get deltaR(): number {
    return this.options.maxR - this.options.minR
  }

  get area(): number {
    return (this.width * this.height) / this.scale
  }

  get areaMultiplier(): number {
    return Math.sqrt(this.area / (1024 * 768))
  }

  //绘制水滴
  private drawDroplet(x: number, y: number, r: number): void {
    this.drawDrop(this.dropletsCtx!, {
      x: x * this.dropletsPixelDensity,
      y: y * this.dropletsPixelDensity,
      r: r * this.dropletsPixelDensity,
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
    })
  }

  //重新加载
  public reload(): void {
    console.log("开始重新加载Canvas...")

    // 1. 停止当前动画循环
    this.pauseAnimation()

    // 2. 完全清除主Canvas
    //this.ctx.clearRect(0, 0, this.width, this.height);

    // // 3. 完全清除小水滴Canvas
    // this.dropletsCtx.clearRect(0, 0,
    //   this.width * this.dropletsPixelDensity,
    //   this.height * this.dropletsPixelDensity
    // );

    // // 4. 重置所有状态变量
    // this.drops = [];
    // this.dropsGfx = [];
    // this.clearDropletsGfx = null;
    // this.dropletsCounter = 0;
    // this.textureCleaningIterations = 0;
    // this.lastRender = null;

    // // 5. 重新创建Canvas (可选，确保完全清洁)
    // this.canvas = createCanvas(this.width, this.height);
    // this.ctx = this.canvas.getContext('2d');

    // this.droplets = createCanvas(
    //   this.width * this.dropletsPixelDensity,
    //   this.height * this.dropletsPixelDensity
    // );
    // this.dropletsCtx = this.droplets.getContext('2d');

    // // 6. 重新渲染图形资源
    // this.renderDropsGfx();

    // // 7. 重新启动动画
    // this.isRunning = true;
    // this.update();

    // console.log('Canvas重新加载完成！');
  }

  //启动动画
  public startAnimation(): void {
    if (!this.isRunning) {
      this.isRunning = true
      this.lastRender = null // 重置时间
      this.update()
    }
  }

  //终止动画
  public abort(): void {
    // 1. 停止动画循环
    this.pauseAnimation()

    // 2. 清空主画布内容
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.width, this.height)
    }
    // 3. 清空小水滴画布内容
    if (this.dropletsCtx && this.droplets) {
      this.dropletsCtx.clearRect(
        0,
        0,
        this.width * this.dropletsPixelDensity,
        this.height * this.dropletsPixelDensity
      )
    }
    // 4. 清空所有数据结构
    if (this.drops) this.drops.length = 0
    if (this.dropsGfx) this.dropsGfx.length = 0
    if (this.clearDropletsGfx) this.clearDropletsGfx = null
    this.dropletsCounter = 0
    this.textureCleaningIterations = 0
    this.lastRender = null

    // 5. 释放canvas和上下文引用，帮助GC
    this.ctx = null
    this.canvas = null
    this.dropletsCtx = null
    this.droplets = null
  }

  // 绘制水滴的样式
  private renderDropsGfx(): void {
    let dropBuffer = createCanvas(dropSize, dropSize)
    let dropBufferCtx = dropBuffer.getContext("2d")
    if (!dropBufferCtx) return

    //生成255个不同样式的水滴
    this.dropsGfx = Array.apply(null, Array(255)).map((cur, i) => {
      let drop = createCanvas(dropSize, dropSize)
      let dropCtx = drop.getContext("2d")
      if (!dropCtx) return drop

      dropBufferCtx.clearRect(0, 0, dropSize, dropSize)

      // 看样子下面这段代码通过颜色的合成，来实现不同深度的蓝色，具体为什么这么些就触及到我的知识盲区了。
      // color
      //绘制图片
      dropBufferCtx.globalCompositeOperation = "source-over"
      dropBufferCtx.drawImage(this.dropColor, 0, 0, dropSize, dropSize)

      // blue overlay, for depth
      // 绘制不同深度的蓝色
      dropBufferCtx.globalCompositeOperation = "screen"
      dropBufferCtx.fillStyle = "rgba(0,0," + i + ",1)"
      dropBufferCtx.fillRect(0, 0, dropSize, dropSize)

      // alpha
      dropCtx.globalCompositeOperation = "source-over"
      dropCtx.drawImage(this.dropAlpha, 0, 0, dropSize, dropSize)

      dropCtx.globalCompositeOperation = "source-in"
      dropCtx.drawImage(dropBuffer, 0, 0, dropSize, dropSize)
      return drop
    })

    // create circle that will be used as a brush to remove droplets
    this.clearDropletsGfx = createCanvas(128, 128)
    let clearDropletsCtx = this.clearDropletsGfx.getContext("2d")
    if (clearDropletsCtx) {
      clearDropletsCtx.fillStyle = "#000"
      clearDropletsCtx.beginPath()
      clearDropletsCtx.arc(64, 64, 64, 0, Math.PI * 2)
      clearDropletsCtx.fill()
    }
  }

  private drawDrop(ctx: CanvasRenderingContext2D, drop: Drop): void {
    if (this.dropsGfx.length > 0) {
      let x = drop.x
      let y = drop.y
      let r = drop.r
      let spreadX = drop.spreadX
      let spreadY = drop.spreadY

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

  //清除小水滴
  private clearDroplets(x: number, y: number, r: number = 30): void {
    if (!this.dropletsCtx || !this.clearDropletsGfx) return

    let ctx = this.dropletsCtx
    ctx.globalCompositeOperation = "destination-out"

    // 清除小水滴
    ctx.drawImage(
      this.clearDropletsGfx,
      (x - r) * this.dropletsPixelDensity * this.scale,
      (y - r) * this.dropletsPixelDensity * this.scale,
      r * 2 * this.dropletsPixelDensity * this.scale,
      r * 2 * this.dropletsPixelDensity * this.scale * 1.5
    )
  }

  //清除画布
  private clearCanvas(): void {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height)
    }
  }

  private createDrop(options: Partial<Drop>): Drop | null {
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier) return null

    return {
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
      ...options,
    }
  }

  public addDrop(drop: Drop): boolean {
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier || drop == null)
      return false

    this.drops.push(drop)
    return true
  }

  private updateRain(timeScale: number): Drop[] {
    let rainDrops: Drop[] = []
    if (this.options.raining) {
      let limit = this.options.rainLimit * timeScale * this.areaMultiplier
      let count = 0
      while (chance(this.options.rainChance * timeScale * this.areaMultiplier) && count < limit) {
        count++
        let r = random(this.options.minR, this.options.maxR, (n: number) => {
          return Math.pow(n, 3)
        })
        let rainDrop = this.createDrop({
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

  //清除雨滴
  public clearDrops(): void {
    this.drops.forEach((drop: Drop) => {
      setTimeout(() => {
        drop.shrink = 0.1 + random(0.5)
      }, random(1200))
    })
    this.clearTexture()
  }

  private clearTexture(): void {
    this.textureCleaningIterations = 50
  }

  //暂停动画
  public pauseAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.isRunning = false
  }

  //更新小雨滴
  private updateDroplets(timeScale: number): void {
    if (!this.dropletsCtx) return

    //消除水滴的痕迹
    if (this.textureCleaningIterations > 0) {
      this.textureCleaningIterations -= 1 * timeScale
      this.dropletsCtx.globalCompositeOperation = "destination-out"
      this.dropletsCtx.fillStyle = "rgba(0,0,0," + 0.05 * timeScale + ")"
      this.dropletsCtx.fillRect(
        0,
        0,
        this.width * this.dropletsPixelDensity,
        this.height * this.dropletsPixelDensity
      )
    }
    //绘制水滴
    if (this.options.raining) {
      //计算水滴的数量
      this.dropletsCounter += this.options.dropletsRate * timeScale * this.areaMultiplier

      //更新每一滴水滴
      times(this.dropletsCounter, (i: number) => {
        this.dropletsCounter--
        this.drawDroplet(
          random(this.width / this.scale), //随机x
          random(this.height / this.scale), //随机y
          random(this.options.dropletsSize[0], this.options.dropletsSize[1], (n: number) => {
            return n * n // 随机水滴的大小
          })
        )
      })
    }
    if (this.ctx && this.droplets) {
      this.ctx.drawImage(this.droplets, 0, 0, this.width, this.height)
    }
  }

  //更新水滴
  private updateDrops(timeScale: number): void {
    let newDrops: Drop[] = []

    this.updateDroplets(timeScale)
    let rainDrops = this.updateRain(timeScale)
    newDrops = newDrops.concat(rainDrops)
    //按照雨滴的纵坐标（y）和横坐标（x）排序，保证渲染顺序正确（视觉上更自然）。
    this.drops.sort((a: Drop, b: Drop) => {
      let va = a.y * (this.width / this.scale) + a.x
      let vb = b.y * (this.width / this.scale) + b.x
      return va > vb ? 1 : va == vb ? 0 : -1
    })

    this.drops.forEach((drop: Drop, i: number) => {
      if (!drop.killed) {
        // update gravity
        // (chance of drops "creeping down")
        if (
          chance(
            (drop.r - this.options.minR * this.options.dropFallMultiplier) *
              (0.1 / this.deltaR) *
              timeScale
          )
        ) {
          drop.momentum += random((drop.r / this.options.maxR) * 4)
        }
        // clean small drops
        if (this.options.autoShrink && drop.r <= this.options.minR && chance(0.05 * timeScale)) {
          drop.shrink += 0.01
        }
        //update shrinkage
        drop.r -= drop.shrink * timeScale
        if (drop.r <= 0) drop.killed = true

        // update trails
        if (this.options.raining) {
          drop.lastSpawn += drop.momentum * timeScale * this.options.trailRate
          if (drop.lastSpawn > drop.nextSpawn) {
            let trailDrop = this.createDrop({
              x: drop.x + random(-drop.r, drop.r) * 0.1,
              y: drop.y - drop.r * 0.01,
              r: drop.r * random(this.options.trailScaleRange[0], this.options.trailScaleRange[1]),
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

        //normalize spread
        drop.spreadX *= Math.pow(0.4, timeScale)
        drop.spreadY *= Math.pow(0.7, timeScale)

        //update position
        let moved = drop.momentum > 0
        if (moved && !drop.killed) {
          drop.y += drop.momentum * this.options.globalTimeScale
          drop.x += drop.momentumX * this.options.globalTimeScale
          if (drop.y > this.height / this.scale + drop.r) {
            drop.killed = true
          }
        }

        // collision
        let checkCollision = (moved || drop.isNew) && !drop.killed
        drop.isNew = false

        if (checkCollision) {
          this.drops.slice(i + 1, i + 70).forEach((drop2: Drop) => {
            //basic check
            if (
              drop != drop2 &&
              drop.r > drop2.r &&
              drop.parent != drop2 &&
              drop2.parent != drop &&
              !drop2.killed
            ) {
              let dx = drop2.x - drop.x
              let dy = drop2.y - drop.y
              var d = Math.sqrt(dx * dx + dy * dy)
              //if it's within acceptable distance
              if (
                d <
                (drop.r + drop2.r) *
                  (this.options.collisionRadius +
                    drop.momentum * this.options.collisionRadiusIncrease * timeScale)
              ) {
                let pi = Math.PI
                let r1 = drop.r
                let r2 = drop2.r
                let a1 = pi * (r1 * r1)
                let a2 = pi * (r2 * r2)
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

        //slowdown momentum
        drop.momentum -= Math.max(1, this.options.minR * 0.5 - drop.momentum) * 0.1 * timeScale
        if (drop.momentum < 0) drop.momentum = 0
        drop.momentumX *= Math.pow(0.7, timeScale)

        if (!drop.killed) {
          newDrops.push(drop)
          //移动的过程中清除小水滴
          if (moved && this.options.dropletsRate > 0)
            this.clearDroplets(
              drop.x,
              drop.y,
              drop.r * this.options.dropletsCleaningRadiusMultiplier
            )
          if (this.ctx) {
            this.drawDrop(this.ctx, drop)
          }
        }
      }
    })

    this.drops = newDrops
  }

  private update(): void {
    this.clearCanvas()

    let now = Date.now()
    if (this.lastRender == null) this.lastRender = now
    let deltaT = now - this.lastRender
    let timeScale = deltaT / ((1 / 60) * 1000)
    if (timeScale > 1.1) timeScale = 1.1
    timeScale *= this.options.globalTimeScale
    this.lastRender = now

    this.updateDrops(timeScale)
    this.animationId = requestAnimationFrame(this.update.bind(this))
  }

  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas
  }
}
