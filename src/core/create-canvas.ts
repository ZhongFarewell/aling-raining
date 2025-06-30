export default function createCanvas(width: number, height: number) {
  let canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}
