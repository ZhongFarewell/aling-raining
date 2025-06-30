interface ImageSource {
  name: string
  src: string
  img?: HTMLImageElement
}

type OnLoadFn = (img: HTMLImageElement, i: number) => void

type ImageInput = string | ImageSource

type ImageLoaderResult = Record<string, { img: HTMLImageElement; src: string }>

function loadImage(src: ImageInput, i: number, onLoad?: OnLoadFn): Promise<ImageSource> {
  return new Promise((resolve, reject) => {
    let imageObj: ImageSource
    if (typeof src == "string") {
      imageObj = {
        name: "image" + i,
        src,
      }
    } else {
      imageObj = src
    }

    let img = new Image()
    imageObj.img = img
    img.addEventListener("load", (event) => {
      if (typeof onLoad == "function") {
        onLoad.call(null, img, i)
      }
      resolve(imageObj)
    })
    img.src = imageObj.src
  })
}

function loadImages(images: ImageInput[], onLoad?: OnLoadFn): Promise<ImageSource[]> {
  return Promise.all(
    images.map((src, i) => {
      return loadImage(src, i, onLoad)
    })
  )
}

export default function ImageLoader(
  images: ImageInput[],
  onLoad?: OnLoadFn
): Promise<ImageLoaderResult> {
  return new Promise((resolve, reject) => {
    loadImages(images, onLoad).then((loadedImages) => {
      const r: ImageLoaderResult = {}
      loadedImages.forEach((curImage) => {
        r[curImage.name] = {
          img: curImage.img!,
          src: curImage.src,
        }
      })
      resolve(r)
    })
  })
}
