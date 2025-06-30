import * as WebGL from "./webgl"
import GL from "./gl-obj"
import loadImages from "./image-loader"
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

const defaultOptions: Required<RainRendererOptions> = {
  renderShadow: false,
  minRefraction: 256,
  maxRefraction: 512,
  brightness: 1,
  alphaMultiply: 20,
  alphaSubtract: 5,
  parallaxBg: 5,
  parallaxFg: 20,
}

type TextureItem = { name: string; img: HTMLImageElement | HTMLCanvasElement | null }

export default class RainRenderer {
  canvas: HTMLCanvasElement
  canvasLiquid: HTMLCanvasElement
  imageShine: HTMLImageElement | HTMLCanvasElement | null
  imageFg: HTMLImageElement | HTMLCanvasElement
  imageBg: HTMLImageElement | HTMLCanvasElement
  options: Required<RainRendererOptions>
  gl: any
  width: number = 0
  height: number = 0
  textures: TextureItem[] | null = null
  programWater: any = null
  programBlurX: any = null
  programBlurY: any = null
  parallaxX: number = 0
  parallaxY: number = 0
  renderShadow: boolean = false
  _animationFrameId: number | null = null

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
    this.options = { ...defaultOptions, ...options }
    this.init()
  }

  init() {
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
    this.textures.forEach((texture, i) => {
      gl.createTexture(texture.img, i + 1)
      gl.createUniform("1i", texture.name, i + 1)
    })
    this.draw()
  }

  abort() {
    console.log("abort")
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId)
      this._animationFrameId = null
    }
    if (this.gl) {
      if (this.textures) {
        this.textures.forEach((texture, i) => {
          if (this.gl.deleteTexture) {
            this.gl.deleteTexture(i + 1)
          }
        })
      }
      if (this.gl.deleteProgram) {
        this.gl.deleteProgram()
      }
      this.gl = null
    }
    if (this.canvas && this.canvas.getContext) {
      const ctx = this.canvas.getContext("2d")
      ctx && ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    if (this.canvasLiquid && this.canvasLiquid.getContext) {
      const ctx = this.canvasLiquid.getContext("2d")
      ctx && ctx.clearRect(0, 0, this.canvasLiquid.width, this.canvasLiquid.height)
    }
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

  draw() {
    this.gl.useProgram(this.programWater)
    this.gl.createUniform("2f", "parallax", this.parallaxX, this.parallaxY)
    this.updateTexture()
    this.gl.draw()
    this._animationFrameId = requestAnimationFrame(this.draw.bind(this))
  }

  updateTextures() {
    if (!this.textures) return
    this.textures.forEach((texture, i) => {
      this.gl.activeTexture(i + 1)
      this.gl.updateTexture(texture.img)
    })
  }

  updateTexture() {
    this.gl.activeTexture(0)
    this.gl.updateTexture(this.canvasLiquid)
  }

  resize() {}

  get overlayTexture(): any {
    return undefined
  }
  set overlayTexture(v: any) {}
}
