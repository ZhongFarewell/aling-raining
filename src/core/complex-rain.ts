import "core-js"
import RainRenderer from "./rain-renderer"
import Raindrops from "./raindrops"
import loadImages from "./image-loader"
import createCanvas from "./create-canvas"
import TweenLite, { Quint } from "gsap"

let videoFg: HTMLVideoElement | null = null,
  videoBg = document.querySelector(".videobg") as HTMLVideoElement

let dropColor: HTMLImageElement, dropAlpha: HTMLImageElement

let textureFg: HTMLCanvasElement,
  textureFgCtx: CanvasRenderingContext2D,
  textureBg: HTMLCanvasElement,
  textureBgCtx: CanvasRenderingContext2D

const textureBgSize = {
  width: 456,
  height: 256,
}
const textureFgSize = {
  width: 114,
  height: 64,
}

let raindrops: Raindrops, renderer: any, canvas: HTMLCanvasElement

let parallax = { x: 0, y: 0 }

function loadTextures() {
  loadImages(
    [
      { name: "dropAlpha", src: "img/drop-alpha.png" },
      { name: "dropColor", src: "img/drop-color.png" },
    ],
    undefined
  ).then((images: Record<string, { img: HTMLImageElement }>) => {
    dropColor = images.dropColor.img
    dropAlpha = images.dropAlpha.img
    init()
  })
}
loadTextures()

function init() {
  canvas = document.querySelector("#container") as HTMLCanvasElement
  let dpi = window.devicePixelRatio
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.width = window.innerWidth + "px"
  canvas.style.height = window.innerHeight + "px"
  raindrops = new Raindrops(canvas.width, canvas.height, dpi, dropAlpha, dropColor, {
    minR: 30,
    maxR: 60,
    collisionRadiusIncrease: 0.002,
    dropletsRate: 35,
    dropletsSize: [3, 7.5],
    dropletsCleaningRadiusMultiplier: 0.3,
  })
  textureFg = createCanvas(textureFgSize.width, textureFgSize.height)
  textureFgCtx = textureFg.getContext("2d")!
  textureBg = createCanvas(textureBgSize.width, textureBgSize.height)
  textureBgCtx = textureBg.getContext("2d")!
  generateTextures()
  renderer = new (RainRenderer as any)(canvas, raindrops.canvas!, textureFg, textureBg, null, {
    brightness: 1.1,
    alphaMultiply: 6,
    alphaSubtract: 3,
    parallaxFg: 40,
  })
  setupEvents()
}

function setupEvents() {
  updateTextures()
  setupParallax()
}
function setupParallax() {
  document.addEventListener("mousemove", (event: MouseEvent) => {
    let x = event.pageX
    let y = event.pageY
    TweenLite.to(parallax, 1, {
      x: (x / canvas.width) * 2 - 1,
      y: (y / canvas.height) * 2 - 1,
      ease: Quint.easeOut,
      onUpdate: () => {
        renderer.parallaxX = parallax.x
        renderer.parallaxY = parallax.y
      },
    })
  })
}
function updateTextures() {
  generateTextures()
  console.log("updateTextures")
  renderer.updateTextures()
  requestAnimationFrame(updateTextures)
}
function generateTextures() {
  textureFgCtx.drawImage(
    videoBg,
    0,
    textureBgSize.height,
    textureFgSize.width,
    textureFgSize.height,
    0,
    0,
    textureFgSize.width,
    textureFgSize.height
  )
  textureBgCtx.drawImage(
    videoBg,
    0,
    0,
    textureBgSize.width,
    textureBgSize.height,
    0,
    0,
    textureBgSize.width,
    textureBgSize.height
  )
}
