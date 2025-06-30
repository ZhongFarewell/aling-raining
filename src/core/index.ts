import { loadTextures, abort } from "./common-rain"
export interface RainOptions {
  bg?: string //背景图片
}
export default class Rain {
  private _id: string
  private _options?: RainOptions
  constructor(id: string, options?: RainOptions) {
    this._id = id
    this._options = options
  }
  init() {
    loadTextures(this._id, this._options)
  }
  //暂停雨
  pause() {}
  //恢复雨
  resume() {}

  //终止雨
  abort() {
    abort()
  }
}
