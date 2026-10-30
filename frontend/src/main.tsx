import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      theme="dark"
      richColors
      closeButton
      visibleToasts={3}
      containerAriaLabel="Thông báo"
      toastOptions={{ style: { fontSize: '15px', padding: '14px 16px' } }}
    />
  </React.StrictMode>,
)
