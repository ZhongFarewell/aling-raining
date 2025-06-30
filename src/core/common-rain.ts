import "core-js"
import RainRenderer from "./rain-renderer"
import Raindrops from "./raindrops"
import loadImages from "./image-loader"
import createCanvas from "./create-canvas"
import TweenLite, { Quint } from "gsap"
import times from "./times"
import { random, chance } from "./random"

// 类型定义
interface WeatherOptions {
  raining?: boolean
  minR?: number
  maxR?: number
  rainChance?: number
  rainLimit?: number
  dropletsRate?: number
  dropletsSize?: [number, number]
  droplets?: number
  trailRate?: number
  trailScaleRange?: [number, number]
  fg?: HTMLImageElement
  bg?: HTMLImageElement
  flashFg?: HTMLImageElement | null
  flashBg?: HTMLImageElement | null
  flashChance?: number
  collisionRadiusIncrease?: number
}

interface WeatherData {
  [key: string]: WeatherOptions
}
export interface BaseCommonRainOptions {
  bg: string
  onInit?: () => void
  fg?: string
  dropColor: string
  dropAlpha: string
  onAbort?: () => void
}
interface LoadTexturesOptions extends BaseCommonRainOptions {
  [key: string]: any
}

interface LoadedImages {
  [key: string]: {
    img: HTMLImageElement
    src: string
  }
}

interface TextureSize {
  width: number
  height: number
}

interface Parallax {
  x: number
  y: number
}

interface Blend {
  v: number
}

interface FlashValue {
  v: number
}

class CommonRain {
  private textureRainFg!: HTMLImageElement
  private textureRainBg!: HTMLImageElement
  private textureStormLightningFg!: HTMLImageElement
  private textureStormLightningBg!: HTMLImageElement
  private textureFalloutFg!: HTMLImageElement
  private textureFalloutBg!: HTMLImageElement
  private textureSunFg!: HTMLImageElement
  private textureSunBg!: HTMLImageElement
  private textureDrizzleFg!: HTMLImageElement
  private textureDrizzleBg!: HTMLImageElement
  private dropColor!: HTMLImageElement
  private dropAlpha!: HTMLImageElement

  private textureFg!: HTMLCanvasElement
  private textureFgCtx!: CanvasRenderingContext2D
  private textureBg!: HTMLCanvasElement
  private textureBgCtx!: CanvasRenderingContext2D

  private options: BaseCommonRainOptions | undefined
  private readonly textureBgSize: TextureSize = {
    width: 384,
    height: 256,
  }
  private readonly textureFgSize: TextureSize = {
    width: 96,
    height: 64,
  }

  private raindrops!: Raindrops
  private renderer!: RainRenderer
  private canvas!: HTMLCanvasElement

  private parallax: Parallax = { x: 0, y: 0 }

  private weatherData: WeatherData | null = null
  private curWeatherData: WeatherOptions | null = null
  private blend: Blend = { v: 0 }

  public async loadTextures(selector: string, options: LoadTexturesOptions): Promise<void> {
    const { bg, fg, dropColor, dropAlpha, onInit, ...other } = options || {}
    this.options = options

    try {
      const images: LoadedImages = await loadImages([
        { name: "dropAlpha", src: dropAlpha },
        { name: "dropColor", src: dropColor },

        { name: "textureRainFg", src: fg ?? bg },
        { name: "textureRainBg", src: bg },

        //{ name: "textureStormLightningFg", src: "img/weather/texture-storm-lightning-fg.png" },
        //{ name: "textureStormLightningBg", src: "img/weather/texture-storm-lightning-bg.png" },

        //{ name: "textureFalloutFg", src: "img/weather/texture-fallout-fg.png" },
        //{ name: "textureFalloutBg", src: "img/weather/texture-fallout-bg.png" },

        //{ name: "textureSunFg", src: "img/weather/texture-sun-fg.png" },
        //{ name: "textureSunBg", src: "img/weather/texture-sun-bg.png" },

        //{ name: "textureDrizzleFg", src: "img/weather/texture-drizzle-fg.png" },
        //{ name: "textureDrizzleBg", src: "img/weather/texture-drizzle-bg.png" },
      ])

      this.textureRainFg = images.textureRainFg.img
      this.textureRainBg = images.textureRainBg.img

      // this.textureFalloutFg = images.textureFalloutFg.img
      // this.textureFalloutBg = images.textureFalloutBg.img

      // this.textureStormLightningFg = images.textureStormLightningFg.img
      // this.textureStormLightningBg = images.textureStormLightningBg.img

      // this.textureSunFg = images.textureSunFg.img
      // this.textureSunBg = images.textureSunBg.img

      // this.textureDrizzleFg = images.textureDrizzleFg.img
      // this.textureDrizzleBg = images.textureDrizzleBg.img

      this.dropColor = images.dropColor.img
      this.dropAlpha = images.dropAlpha.img

      this.init(selector)
      onInit?.()
    } catch (error) {
      console.error("Failed to load textures:", error)
    }
  }

  private init(selector?: string): void {
    this.canvas = document.querySelector(selector ?? "#aling-rain-cover") as HTMLCanvasElement

    const dpi = window.devicePixelRatio
    this.canvas.width = window.innerWidth * dpi
    this.canvas.height = window.innerHeight * dpi
    this.canvas.style.width = window.innerWidth + "px"
    this.canvas.style.height = window.innerHeight + "px"

    this.raindrops = new Raindrops(
      this.canvas.width,
      this.canvas.height,
      dpi,
      this.dropAlpha,
      this.dropColor,
      {
        trailRate: 1,
        trailScaleRange: [0.2, 0.45],
        collisionRadius: 0.45,
        dropletsCleaningRadiusMultiplier: 0.28,
      }
    )

    this.textureFg = createCanvas(this.textureFgSize.width, this.textureFgSize.height)
    this.textureFgCtx = this.textureFg.getContext("2d")!
    this.textureBg = createCanvas(this.textureBgSize.width, this.textureBgSize.height)
    this.textureBgCtx = this.textureBg.getContext("2d")!

    this.generateTextures(this.textureRainFg, this.textureRainBg)

    this.renderer = new RainRenderer(
      this.canvas,
      this.raindrops.getCanvas()!,
      this.textureFg,
      this.textureBg,
      null,
      {
        brightness: 1.04,
        alphaMultiply: 6,
        alphaSubtract: 3,
        // minRefraction:256,
        // maxRefraction:512
      }
    )

    this.setupEvents()
  }

  public abort(): void {
    this.raindrops.abort()
    this.renderer.abort()
    this.options?.onAbort?.()
  }

  private setupEvents(): void {
    this.setupParallax()
    //this.setupWeather();
    //this.setupFlash();
  }

  private setupParallax(): void {
    document.addEventListener("mousemove", (event: MouseEvent) => {
      const x = event.pageX
      const y = event.pageY

      TweenLite.to(this.parallax, 1, {
        x: (x / this.canvas.width) * 2 - 1,
        y: (y / this.canvas.height) * 2 - 1,
        ease: Quint.easeOut,
        onUpdate: () => {
          this.renderer.parallaxX = this.parallax.x
          this.renderer.parallaxY = this.parallax.y
        },
      })
    })
  }

  // private setupWeatherData(): void {
  //   const defaultWeather: WeatherOptions = {
  //     raining: true,
  //     minR: 20,
  //     maxR: 50,
  //     rainChance: 0.35,
  //     rainLimit: 6,
  //     dropletsRate: 50,
  //     dropletsSize: [3, 5.5],
  //     trailRate: 1,
  //     trailScaleRange: [0.25, 0.35],
  //     fg: this.textureRainFg,
  //     bg: this.textureRainBg,
  //     flashFg: null,
  //     flashBg: null,
  //     flashChance: 0,
  //     collisionRadiusIncrease: 0.0002,
  //   }

  //   const weather = (data: Partial<WeatherOptions>): WeatherOptions => {
  //     return Object.assign({}, defaultWeather, data)
  //   }

  //   this.weatherData = {
  //     rain: weather({
  //       rainChance: 0.35,
  //       dropletsRate: 50,
  //       raining: true,
  //       // trailRate:2.5,
  //       fg: this.textureRainFg,
  //       bg: this.textureRainBg,
  //     }),
  //     storm: weather({
  //       maxR: 55,
  //       rainChance: 0.4,
  //       dropletsRate: 80,
  //       dropletsSize: [3, 5.5],
  //       trailRate: 2.5,
  //       trailScaleRange: [0.25, 0.4],
  //       fg: this.textureRainFg,
  //       bg: this.textureRainBg,
  //       flashFg: this.textureStormLightningFg,
  //       flashBg: this.textureStormLightningBg,
  //       flashChance: 0.1,
  //     }),
  //     fallout: weather({
  //       minR: 30,
  //       maxR: 60,
  //       rainChance: 0.35,
  //       dropletsRate: 20,
  //       trailRate: 4,
  //       fg: this.textureFalloutFg,
  //       bg: this.textureFalloutBg,
  //       collisionRadiusIncrease: 0,
  //     }),
  //     drizzle: weather({
  //       minR: 10,
  //       maxR: 40,
  //       rainChance: 0.15,
  //       rainLimit: 2,
  //       dropletsRate: 10,
  //       dropletsSize: [3.5, 6],
  //       fg: this.textureDrizzleFg,
  //       bg: this.textureDrizzleBg,
  //     }),
  //     sunny: weather({
  //       rainChance: 0,
  //       rainLimit: 0,
  //       droplets: 0,
  //       raining: false,
  //       fg: this.textureSunFg,
  //       bg: this.textureSunBg,
  //     }),
  //   }
  // }

  // private async flash(
  //   baseBg: HTMLImageElement,
  //   baseFg: HTMLImageElement,
  //   flashBg: HTMLImageElement,
  //   flashFg: HTMLImageElement
  // ): Promise<void> {
  //   const flashValue: FlashValue = { v: 0 }

  //   const transitionFlash = (to: number, t: number = 0.025): Promise<void> => {
  //     return new Promise<void>((resolve) => {
  //       TweenLite.to(flashValue, t, {
  //         v: to,
  //         ease: Quint.easeOut,
  //         onUpdate: () => {
  //           this.generateTextures(baseFg, baseBg)
  //           this.generateTextures(flashFg, flashBg, flashValue.v)
  //           this.renderer.updateTextures()
  //         },
  //         onComplete: () => {
  //           resolve()
  //         },
  //       })
  //     })
  //   }

  //   let lastFlash = transitionFlash(1)
  //   times(random(2, 7), (i: number) => {
  //     lastFlash = lastFlash.then(() => {
  //       return transitionFlash(random(0.1, 1))
  //     })
  //   })

  //   lastFlash = lastFlash
  //     .then(() => {
  //       return transitionFlash(1, 0.1)
  //     })
  //     .then(() => {
  //       transitionFlash(0, 0.25)
  //     })
  // }

  private generateTextures(fg: HTMLImageElement, bg: HTMLImageElement, alpha: number = 1): void {
    this.textureFgCtx.globalAlpha = alpha
    this.textureFgCtx.drawImage(fg, 0, 0, this.textureFgSize.width, this.textureFgSize.height)

    this.textureBgCtx.globalAlpha = alpha
    this.textureBgCtx.drawImage(bg, 0, 0, this.textureBgSize.width, this.textureBgSize.height)
  }
}

// 创建单例实例
const commonRain = new CommonRain()

// 导出函数，保持向后兼容
export const loadTextures = (selector: string, options: LoadTexturesOptions): void => {
  commonRain.loadTextures(selector, options)
}

export const abort = (): void => {
  commonRain.abort()
}

export default CommonRain
