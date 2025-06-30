import React from "react"
import { Box } from "@mui/system"
import { Form, Modal } from "antd"
import { useNavigate } from "react-router-dom"
import Rain from "@/demo"
export default function () {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate("rain")}>调</button>
      <Rain>gdfgf</Rain>
    </>
  )
}
