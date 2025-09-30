import React, { PropsWithChildren, useEffect, useRef } from 'react'
import Rain from '../../src/core'
import { Button } from 'antd'
export interface RainProps extends PropsWithChildren {
  style?: React.CSSProperties
}
export default (props: RainProps) => {
  const { style, children } = props
  const rainstance = useRef<Rain>(
    new Rain('#aling-rain-cover', {
      bg: 'img/weather/texture-rain-bg.png',
      fg: 'img/weather/texture-rain-fg.png',
      video: '#video-el',
      onAbort() {
        console.log('abort')
      },
      maxDrops: 1000,
      minR: 30,
      maxR: 60,
      dropAlpha: 'img/drop-alpha.png',
      dropColor: 'img/drop-color.png',
      onInit() {
        console.log('init')
      }
    })
  )

  return (
    <>
      <div
        style={{
          width: '100%',
          position: 'absolute',
          overflow: 'hidden',
          zIndex: 1,
          height: '100%',
          ...style
        }}
      >
        <Button onClick={() => rainstance.current.init()}>初始化</Button>
        <Button onClick={() => rainstance.current.abort()}>终止渲染</Button>
        <canvas
          style={{ width: '100%', height: '100%' }}
          id='aling-rain-cover'
          //ref={canvasRef}
        ></canvas>
        <video
          style={{ position: 'absolute', top: 0 }}
          autoPlay
          loop
          muted
          width={1}
          height={1}
          id='video-el'
          src='test.mp4'
        ></video>
      </div>
      {children}
    </>
  )
}
