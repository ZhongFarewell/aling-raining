import React, { PropsWithChildren, useEffect, useRef } from "react"
import Rain from "./core"
import { Button } from "antd"
export interface RainProps extends PropsWithChildren {
  style?: React.CSSProperties
}
export default (props: RainProps) => {
  const { style, children } = props
  const rainstance = useRef<Rain>(
    new Rain("#aling-rain-cover", {
      bg: "https://www.zhongfw.online/awsome/_next/image?url=https%3A%2F%2Fzhongfw.online%2Falign-minio%2Fmemoryimage%2F75b951f22850979b18dae0ec4e32b24f.jpeg&w=256&q=75",
    })
  )

  return (
    <>
      <div
        style={{
          width: "100%",
          position: "absolute",
          overflow: "hidden",
          zIndex: 1,
          height: "100%",
          ...style,
        }}
      >
        <Button onClick={() => rainstance.current.init()}>初始化</Button>
        <Button onClick={() => rainstance.current.abort()}>终止渲染</Button>
        <canvas
          style={{ width: "100%", height: "100%" }}
          id='aling-rain-cover'
          //ref={canvasRef}
        ></canvas>
      </div>
      {children}
    </>
  )
}
