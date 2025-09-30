import CommonRain, { BaseRainOptions, CommonLoadTexturesOptions } from './common-rain'
import VideoRain, { VideoLoadTexturesOptions, VideoRainOptions } from './video-rain'
export interface RainOptions extends BaseRainOptions {
  video?: string
}
export default class Rain {
  private _id: string
  private _options: VideoLoadTexturesOptions | CommonLoadTexturesOptions
  private instance: CommonRain | VideoRain
  constructor(id: string, options: RainOptions) {
    this._id = id
    this._options = options
    if (options.video) {
      this.instance = new VideoRain()
    } else {
      this.instance = new CommonRain()
    }
  }
  init() {
    this.instance.loadTextures(this._id, this._options)
  }
  //暂停雨
  pause() {}
  //恢复雨
  resume() {}

  //终止雨
  abort() {
    this.instance.abort()
  }
}
