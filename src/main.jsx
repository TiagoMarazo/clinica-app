import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            borderRadius: '10px',
            padding: '12px 16px',
          },
          success: {
            style: {
              background: '#EDF7F2',
              color: '#1a5c3a',
              border: '1px solid #c3e6d8',
            },
            iconTheme: { primary: '#4FB286', secondary: '#fff' },
          },
          error: {
            style: {
              background: '#fdf0f0',
              color: '#8b1a1a',
              border: '1px solid #f5c6c6',
            },
            iconTheme: { primary: '#D64545', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
