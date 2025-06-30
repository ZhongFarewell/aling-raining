interface ImageSource {
  name: string
  src: string
  img?: HTMLImageElement
}

interface LoadedImage {
  name: string
  img: HTMLImageElement
  src: string
}

interface ImageResult {
  [key: string]: {
    img: HTMLImageElement
    src: string
  }
}

type OnLoadCallback = (img: HTMLImageElement, index: number) => void

function loadImage(
  src: string | ImageSource,
  i: number,
  onLoad?: OnLoadCallback
): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    let imageSource: ImageSource

    if (typeof src === "string") {
      imageSource = {
        name: "image" + i,
        src,
      }
    } else {
      imageSource = src
    }

    let img = new Image()
    imageSource.img = img
    img.addEventListener("load", (event) => {
      if (typeof onLoad === "function") {
        onLoad.call(null, img, i)
      }
      resolve(imageSource as LoadedImage)
    })
    img.src = imageSource.src
  })
}

function loadImages(
  images: (string | ImageSource)[],
  onLoad?: OnLoadCallback
): Promise<LoadedImage[]> {
  return Promise.all(
    images.map((src, i) => {
      return loadImage(src, i, onLoad)
    })
  )
}

export default function ImageLoader(
  images: (string | ImageSource)[],
  onLoad?: OnLoadCallback
): Promise<ImageResult> {
  return new Promise((resolve, reject) => {
    loadImages(images, onLoad).then((loadedImages) => {
      let r: ImageResult = {}
      loadedImages.forEach((curImage) => {
        r[curImage.name] = {
          img: curImage.img,
          src: curImage.src,
        }
      })

      resolve(r)
    })
  })
}
