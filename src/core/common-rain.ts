import "core-js"
import RainRenderer from "./rain-renderer"
import Raindrops from "./raindrops"
import loadImages from "./image-loader"
import createCanvas from "./create-canvas"
import TweenLite, { Quint } from "gsap"
import times from "./times"
import { random, chance } from "./random"

let textureRainFg: HTMLImageElement,
  textureRainBg: HTMLImageElement,
  textureStormLightningFg: HTMLImageElement,
  textureStormLightningBg: HTMLImageElement,
  textureFalloutFg: HTMLImageElement,
  textureFalloutBg: HTMLImageElement,
  textureSunFg: HTMLImageElement,
  textureSunBg: HTMLImageElement,
  textureDrizzleFg: HTMLImageElement,
  textureDrizzleBg: HTMLImageElement,
  dropColor: HTMLImageElement,
  dropAlpha: HTMLImageElement

let textureFg: HTMLCanvasElement,
  textureFgCtx: CanvasRenderingContext2D,
  textureBg: HTMLCanvasElement,
  textureBgCtx: CanvasRenderingContext2D

const textureBgSize = {
  width: 384,
  height: 256,
}
const textureFgSize = {
  width: 96,
  height: 64,
}

let raindrops: Raindrops, renderer: any, canvas: HTMLCanvasElement

let parallax = { x: 0, y: 0 }

let weatherData: any = null
let curWeatherData: any = null
let blend = { v: 0 }

export function loadTextures(selector: string, options: Record<string, any> = {}) {
  const { bgImg, ...other } = options
  loadImages(
    [
      { name: "dropAlpha", src: "img/drop-alpha.png" },
      { name: "dropColor", src: "img/drop-color.png" },
      { name: "textureRainFg", src: "img/weather/texture-rain-fg.png" },
      { name: "textureRainBg", src: "img/weather/texture-rain-bg.png" },
      { name: "textureStormLightningFg", src: "img/weather/texture-storm-lightning-fg.png" },
      { name: "textureStormLightningBg", src: "img/weather/texture-storm-lightning-bg.png" },
      { name: "textureFalloutFg", src: "img/weather/texture-fallout-fg.png" },
      { name: "textureFalloutBg", src: "img/weather/texture-fallout-bg.png" },
      { name: "textureSunFg", src: "img/weather/texture-sun-fg.png" },
      { name: "textureSunBg", src: "img/weather/texture-sun-bg.png" },
      { name: "textureDrizzleFg", src: "img/weather/texture-drizzle-fg.png" },
      { name: "textureDrizzleBg", src: "img/weather/texture-drizzle-bg.png" },
    ],
    undefined
  ).then((images: Record<string, { img: HTMLImageElement }>) => {
    textureRainFg = images.textureRainFg.img
    textureRainBg = images.textureRainBg.img
    textureFalloutFg = images.textureFalloutFg.img
    textureFalloutBg = images.textureFalloutBg.img
    textureStormLightningFg = images.textureStormLightningFg.img
    textureStormLightningBg = images.textureStormLightningBg.img
    textureSunFg = images.textureSunFg.img
    textureSunBg = images.textureSunBg.img
    textureDrizzleFg = images.textureDrizzleFg.img
    textureDrizzleBg = images.textureDrizzleBg.img
    dropColor = images.dropColor.img
    dropAlpha = images.dropAlpha.img
    init(selector)
  })
}

function init(selector: string) {
  canvas = document.querySelector(selector ?? "#aling-rain-cover") as HTMLCanvasElement
  let dpi = window.devicePixelRatio
  canvas.width = window.innerWidth * dpi
  canvas.height = window.innerHeight * dpi
  canvas.style.width = window.innerWidth + "px"
  canvas.style.height = window.innerHeight + "px"
  raindrops = new Raindrops(canvas.width, canvas.height, dpi, dropAlpha, dropColor, {
    trailRate: 1,
    trailScaleRange: [0.2, 0.45],
    collisionRadius: 0.45,
    dropletsCleaningRadiusMultiplier: 0.28,
  })
  textureFg = createCanvas(textureFgSize.width, textureFgSize.height)
  textureFgCtx = textureFg.getContext("2d")!
  textureBg = createCanvas(textureBgSize.width, textureBgSize.height)
  textureBgCtx = textureBg.getContext("2d")!
  renderer = new RainRenderer(canvas, raindrops.canvas!, textureFg, textureBg, null, {
    brightness: 1.04,
    alphaMultiply: 6,
    alphaSubtract: 3,
  })
  setupEvents()
}

export function abort() {
  raindrops.abort()
  renderer.abort()
}

function setupEvents() {
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

function setupWeatherData() {
  let defaultWeather = {
    raining: true,
    minR: 20,
    maxR: 50,
    rainChance: 0.35,
    rainLimit: 6,
    dropletsRate: 50,
    dropletsSize: [3, 5.5],
    trailRate: 1,
    trailScaleRange: [0.25, 0.35],
    fg: textureRainFg,
    bg: textureRainBg,
    flashFg: null,
    flashBg: null,
    flashChance: 0,
    collisionRadiusIncrease: 0.0002,
  }

  function weather(data: any) {
    return Object.assign({}, defaultWeather, data)
  }

  weatherData = {
    rain: weather({
      rainChance: 0.35,
      dropletsRate: 50,
      raining: true,
      fg: textureRainFg,
      bg: textureRainBg,
    }),
    storm: weather({
      maxR: 55,
      rainChance: 0.4,
      dropletsRate: 80,
      dropletsSize: [3, 5.5],
      trailRate: 2.5,
      trailScaleRange: [0.25, 0.4],
      fg: textureRainFg,
      bg: textureRainBg,
      flashFg: textureStormLightningFg,
      flashBg: textureStormLightningBg,
      flashChance: 0.1,
    }),
    fallout: weather({
      minR: 30,
      maxR: 60,
      rainChance: 0.35,
      dropletsRate: 20,
      trailRate: 4,
      fg: textureFalloutFg,
      bg: textureFalloutBg,
      collisionRadiusIncrease: 0,
    }),
    drizzle: weather({
      minR: 10,
      maxR: 40,
      rainChance: 0.15,
      rainLimit: 2,
      dropletsRate: 10,
      dropletsSize: [3.5, 6],
      fg: textureDrizzleFg,
      bg: textureDrizzleBg,
    }),
    sunny: weather({
      rainChance: 0,
      rainLimit: 0,
      droplets: 0,
      raining: false,
      fg: textureSunFg,
      bg: textureSunBg,
    }),
  }
}

function flash(
  baseBg: HTMLImageElement,
  baseFg: HTMLImageElement,
  flashBg: HTMLImageElement,
  flashFg: HTMLImageElement
) {
  let flashValue = { v: 0 }
  function transitionFlash(to: number, t = 0.025) {
    return new Promise<void>((resolve) => {
      TweenLite.to(flashValue, t, {
        v: to,
        ease: Quint.easeOut,
        onUpdate: () => {
          generateTextures(baseFg, baseBg)
          generateTextures(flashFg, flashBg, flashValue.v)
          renderer.updateTextures()
        },
        onComplete: () => {
          resolve()
        },
      })
    })
  }

  let lastFlash = transitionFlash(1)
  times(random(2, 7), (i: number) => {
    lastFlash = lastFlash.then(() => {
      return transitionFlash(random(0.1, 1))
    })
  })
  lastFlash = lastFlash
    .then(() => {
      return transitionFlash(1, 0.1)
    })
    .then(() => {
      transitionFlash(0, 0.25)
    })
}

function generateTextures(fg: HTMLImageElement, bg: HTMLImageElement, alpha = 1) {
  textureFgCtx.globalAlpha = alpha
  textureFgCtx.drawImage(fg, 0, 0, textureFgSize.width, textureFgSize.height)

  textureBgCtx.globalAlpha = alpha
  textureBgCtx.drawImage(bg, 0, 0, textureBgSize.width, textureBgSize.height)
}
