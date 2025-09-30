import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './APP'

document.body.innerHTML = "<div id='app'></div>"
const root = createRoot(document.querySelector('#app') as Element)
root.render(<App></App>)
