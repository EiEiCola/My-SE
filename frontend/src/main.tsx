import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './Global.css'
import './output.css'

import PublicRoutes from './routes/PublicRoutes.tsx'
import AdminRoutes from './routes/AdminRoutes.tsx'
import UserRoutes from './routes/userRoutes.tsx'
import { BrowserRouter } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { WebSocketProvider } from './contexts/WebSocketContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AntApp>
        <WebSocketProvider>
          <PublicRoutes />
          <AdminRoutes />
          <UserRoutes />
        </WebSocketProvider>
      </AntApp>
    </BrowserRouter>
  </StrictMode>
)


