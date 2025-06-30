import * as WebGL from "./webgl"
import GL from "./gl-obj"
import createCanvas from "./create-canvas"
import { vertShader, fragShader } from "./shaders"

interface RainRendererOptions {
  renderShadow?: boolean
  minRefraction?: number
  maxRefraction?: number
  brightness?: number
  alphaMultiply?: number
  alphaSubtract?: number
  parallaxBg?: number
  parallaxFg?: number
}

interface TextureItem {
  name: string
  img: HTMLImageElement | HTMLCanvasElement
}

/**
 * RainRenderer 默认参数配置：
 *
 * renderShadow: 是否渲染水滴阴影（true/false）
 * minRefraction: 折射最小值，影响水滴的折射强度
 * maxRefraction: 折射最大值，影响水滴的折射强度
 * brightness: 整体亮度系数
 * alphaMultiply: alpha 通道乘法系数（影响水滴透明度）
 * alphaSubtract: alpha 通道减法系数（影响水滴透明度）
 * parallaxBg: 背景视差系数
 * parallaxFg: 前景视差系数
 */
const defaultOptions: Required<RainRendererOptions> = {
  renderShadow: false, // 是否渲染水滴阴影
  minRefraction: 256, // 折射最小值
  maxRefraction: 512, // 折射最大值
  brightness: 1, // 亮度系数
  alphaMultiply: 20, // alpha 通道乘法系数
  alphaSubtract: 5, // alpha 通道减法系数
  parallaxBg: 5, // 背景视差系数
  parallaxFg: 20, // 前景视差系数
}

class RainRenderer {
  private canvas: HTMLCanvasElement
  private gl: GL | null = null
  private canvasLiquid: HTMLCanvasElement
  private width: number = 0
  private height: number = 0
  private imageShine: HTMLImageElement | HTMLCanvasElement | null
  private imageFg: HTMLImageElement | HTMLCanvasElement
  private imageBg: HTMLImageElement | HTMLCanvasElement
  private textures: TextureItem[] | null = null
  private programWater: WebGLProgram | null = null
  private programBlurX: WebGLProgram | null = null
  private programBlurY: WebGLProgram | null = null
  public parallaxX: number = 0
  public parallaxY: number = 0
  private renderShadow: boolean = false
  private options: Required<RainRendererOptions>
  private _animationFrameId: number | null = null

  constructor(
    canvas: HTMLCanvasElement,
    canvasLiquid: HTMLCanvasElement,
    imageFg: HTMLImageElement | HTMLCanvasElement,
    imageBg: HTMLImageElement | HTMLCanvasElement,
    imageShine: HTMLImageElement | HTMLCanvasElement | null = null,
    options: RainRendererOptions = {}
  ) {
    this.canvas = canvas
    this.canvasLiquid = canvasLiquid
    this.imageShine = imageShine
    this.imageFg = imageFg
    this.imageBg = imageBg
    this.options = Object.assign({}, defaultOptions, options)
    this.init()
  }

  private init(): void {
    this.width = this.canvas.width
    this.height = this.canvas.height
    this.gl = new GL(this.canvas, { alpha: false }, vertShader, fragShader)
    const gl = this.gl
    this.programWater = gl.program

    gl.createUniform("2f", "resolution", this.width, this.height)
    gl.createUniform("1f", "textureRatio", this.imageBg.width / this.imageBg.height)
    gl.createUniform("1i", "renderShine", this.imageShine == null ? false : true)
    gl.createUniform("1i", "renderShadow", this.options.renderShadow)
    gl.createUniform("1f", "minRefraction", this.options.minRefraction)
    gl.createUniform(
      "1f",
      "refractionDelta",
      this.options.maxRefraction - this.options.minRefraction
    )
    gl.createUniform("1f", "brightness", this.options.brightness)
    gl.createUniform("1f", "alphaMultiply", this.options.alphaMultiply)
    gl.createUniform("1f", "alphaSubtract", this.options.alphaSubtract)
    gl.createUniform("1f", "parallaxBg", this.options.parallaxBg)
    gl.createUniform("1f", "parallaxFg", this.options.parallaxFg)

    gl.createTexture(null, 0)

    this.textures = [
      { name: "textureShine", img: this.imageShine == null ? createCanvas(2, 2) : this.imageShine },
      { name: "textureFg", img: this.imageFg },
      { name: "textureBg", img: this.imageBg },
    ]

    this.textures.forEach((texture: TextureItem, i: number) => {
      gl.createTexture(texture.img, i + 1)
      gl.createUniform("1i", texture.name, i + 1)
    })

    this.draw()
  }

  public abort(): void {
    // 1. 停止动画循环
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId)
      this._animationFrameId = null
    }

    //2. 释放WebGL相关资源
    if (this.gl) {
      // 释放所有纹理
      if (this.textures) {
        this.textures.forEach((texture: TextureItem, i: number) => {
          if (this.gl && this.gl.deleteTexture) {
            this.gl.deleteTexture(i + 1)
          }
        })
      }
      // 释放主program
      if (this.gl.deleteProgram) {
        this.gl.deleteProgram()
      }
      // 释放WebGL上下文引用
      this.gl = null
    }

    // 3. 清空画布内容
    if (this.canvas && this.canvas.getContext) {
      const ctx = this.canvas.getContext("2d")
      ctx && ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    if (this.canvasLiquid && this.canvasLiquid.getContext) {
      const ctx = this.canvasLiquid.getContext("2d")
      ctx && ctx.clearRect(0, 0, this.canvasLiquid.width, this.canvasLiquid.height)
    }

    // 4. 置空所有引用，帮助GC
    this.canvas = null as any
    this.canvasLiquid = null as any
    this.imageShine = null
    this.imageFg = null as any
    this.imageBg = null as any
    this.textures = null
    this.programWater = null
    this.programBlurX = null
    this.programBlurY = null
  }

  private draw(): void {
    if (!this.gl || !this.programWater) return

    this.gl.useProgram(this.programWater)
    this.gl.createUniform("2f", "parallax", this.parallaxX, this.parallaxY)
    this.updateTexture()
    this.gl.draw()

    this._animationFrameId = requestAnimationFrame(this.draw.bind(this))
  }

  public updateTextures(): void {
    if (!this.gl || !this.textures) return

    this.textures.forEach((texture: TextureItem, i: number) => {
      this.gl!.activeTexture(i + 1)
      this.gl!.updateTexture(texture.img)
    })
  }

  private updateTexture(): void {
    if (!this.gl) return

    this.gl.activeTexture(0)
    this.gl.updateTexture(this.canvasLiquid)
  }

  public resize(): void {
    // 实现resize逻辑
  }

  public get overlayTexture(): any {
    // 实现getter逻辑
    return null
  }

  public set overlayTexture(v: any) {
    // 实现setter逻辑
  }
}

export default RainRenderer
