import * as WebGL from "./webgl"

export default class GL {
  canvas!: HTMLCanvasElement
  gl: WebGLRenderingContext | null = null
  program: WebGLProgram | null = null
  width: number = 0
  height: number = 0
  textures: (WebGLTexture | null)[] = []

  constructor(canvas: HTMLCanvasElement, options: any, vert: string, frag: string) {
    this.init(canvas, options, vert, frag)
  }

  init(canvas: HTMLCanvasElement, options: any, vert: string, frag: string) {
    this.canvas = canvas
    this.width = canvas.width
    this.height = canvas.height
    this.gl = WebGL.getContext(canvas, options)
    this.program = this.createProgram(vert, frag)
    this.useProgram(this.program)
  }

  createProgram(vert: string, frag: string): WebGLProgram | null {
    return WebGL.createProgram(this.gl!, vert, frag)
  }

  useProgram(program: WebGLProgram | null) {
    this.program = program
    if (this.gl && program) {
      this.gl.useProgram(program)
    }
  }

  createTexture(source: TexImageSource | null, i: number) {
    if (!this.gl) return null
    const texture = WebGL.createTexture(this.gl, source, i)
    this.textures[i] = texture
    return texture
  }

  deleteProgram() {
    if (this.program && this.gl) {
      this.gl.deleteProgram(this.program)
      this.program = null
    }
  }

  deleteTexture(i: number) {
    if (this.textures && this.textures[i] && this.gl) {
      this.gl.deleteTexture(this.textures[i])
      this.textures[i] = null
    }
  }

  createUniform(type: string, name: string, ...v: any[]) {
    if (this.gl && this.program) {
      WebGL.createUniform(this.gl, this.program, type, name, ...v)
    }
  }

  activeTexture(i: number) {
    if (this.gl) {
      WebGL.activeTexture(this.gl, i)
    }
  }

  updateTexture(source: TexImageSource) {
    if (this.gl) {
      WebGL.updateTexture(this.gl, source)
    }
  }

  draw() {
    if (this.gl) {
      WebGL.setRectangle(this.gl, -1, -1, 2, 2)
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
    }
  }
}
