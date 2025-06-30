import * as WebGL from "./webgl"

export default class GL {
  public canvas: HTMLCanvasElement | null = null
  public gl: WebGLRenderingContext | null = null
  public program: WebGLProgram | null = null
  public width: number = 0
  public height: number = 0
  public textures: (WebGLTexture | null)[] = []

  constructor(
    canvas: HTMLCanvasElement,
    options: WebGLContextAttributes,
    vert: string,
    frag: string
  ) {
    this.init(canvas, options, vert, frag)
  }

  private init(
    canvas: HTMLCanvasElement,
    options: WebGLContextAttributes,
    vert: string,
    frag: string
  ): void {
    this.canvas = canvas
    this.width = canvas.width
    this.height = canvas.height
    this.gl = WebGL.getContext(canvas, options)
    this.program = this.createProgram(vert, frag)
    if (this.program) {
      this.useProgram(this.program)
    }
  }

  private createProgram(vert: string, frag: string): WebGLProgram | null {
    if (!this.gl) return null
    let program = WebGL.createProgram(this.gl, vert, frag)
    return program
  }

  public useProgram(program: WebGLProgram): void {
    this.program = program
    if (this.gl) {
      this.gl.useProgram(program)
    }
  }

  public createTexture(source: TexImageSource | null, i: number): WebGLTexture | null {
    if (!this.gl) return null
    const texture = WebGL.createTexture(this.gl, source, i)
    this.textures[i] = texture
    return texture
  }

  public deleteProgram(): void {
    if (this.program && this.gl) {
      this.gl.deleteProgram(this.program)
      this.program = null
    }
  }

  public deleteTexture(i: number): void {
    if (this.textures && this.textures[i] && this.gl) {
      this.gl.deleteTexture(this.textures[i]!)
      this.textures[i] = null
    }
  }

  public createUniform(type: string, name: string, ...v: any[]): void {
    if (this.gl && this.program) {
      WebGL.createUniform(this.gl, this.program, type, name, ...v)
    }
  }

  public activeTexture(i: number): void {
    if (this.gl) {
      WebGL.activeTexture(this.gl, i)
    }
  }

  public updateTexture(source: TexImageSource): void {
    if (this.gl) {
      WebGL.updateTexture(this.gl, source)
    }
  }

  public draw(): void {
    if (this.gl) {
      WebGL.setRectangle(this.gl, -1, -1, 2, 2)
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
    }
  }
}
