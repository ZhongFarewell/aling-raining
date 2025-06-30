export function getContext(
  canvas: HTMLCanvasElement,
  options: WebGLContextAttributes = {}
): WebGLRenderingContext | null {
  let contexts = ["webgl", "experimental-webgl"]
  let context: WebGLRenderingContext | null = null

  contexts.some((name) => {
    try {
      context = canvas.getContext(name, options) as WebGLRenderingContext
    } catch (e) {}
    return context != null
  })

  if (context == null) {
    document.body.classList.add("no-webgl")
  }

  return context
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexScript: string,
  fragScript: string
): WebGLProgram | null {
  let vertexShader = createShader(gl, vertexScript, gl.VERTEX_SHADER)
  let fragShader = createShader(gl, fragScript, gl.FRAGMENT_SHADER)

  if (!vertexShader || !fragShader) {
    return null
  }

  let program = gl.createProgram()
  if (!program) {
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragShader)

  gl.linkProgram(program)

  let linked = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!linked) {
    var lastError = gl.getProgramInfoLog(program)
    error("Error in program linking: " + lastError)
    gl.deleteProgram(program)
    return null
  }

  var positionLocation = gl.getAttribLocation(program, "a_position")
  var texCoordLocation = gl.getAttribLocation(program, "a_texCoord")

  var texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]),
    gl.STATIC_DRAW
  )
  gl.enableVertexAttribArray(texCoordLocation)
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

  // Create a buffer for the position of the rectangle corners.
  var buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  return program
}

export function createShader(
  gl: WebGLRenderingContext,
  script: string,
  type: number
): WebGLShader | null {
  let shader = gl.createShader(type)
  if (!shader) {
    return null
  }

  gl.shaderSource(shader, script)
  gl.compileShader(shader)

  let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

  if (!compiled) {
    let lastError = gl.getShaderInfoLog(shader)
    error("Error compiling shader '" + shader + "':" + lastError)
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function createTexture(
  gl: WebGLRenderingContext,
  source: TexImageSource | null,
  i: number
): WebGLTexture | null {
  var texture = gl.createTexture()
  if (!texture) {
    return null
  }

  activeTexture(gl, i)
  gl.bindTexture(gl.TEXTURE_2D, texture)

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  if (source == null) {
    return texture
  } else {
    updateTexture(gl, source)
  }

  return texture
}

export function createUniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  type: string,
  name: string,
  ...args: any[]
): void {
  let location = gl.getUniformLocation(program, "u_" + name)
  ;(gl as any)["uniform" + type](location, ...args)
}

export function activeTexture(gl: WebGLRenderingContext, i: number): void {
  ;(gl as any).activeTexture((gl as any)["TEXTURE" + i])
}

export function updateTexture(gl: WebGLRenderingContext, source: TexImageSource): void {
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
}

export function setRectangle(
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  var x1 = x
  var x2 = x + width
  var y1 = y
  var y2 = y + height
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  )
}

function error(msg: string): void {
  console.error(msg)
}
