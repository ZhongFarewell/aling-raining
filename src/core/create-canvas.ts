export default function createCanvas(width: number, height: number): HTMLCanvasElement {
  let canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}
