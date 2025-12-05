import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import App from './app/App.tsx'
import PublicRoutes from './routes/PublicRoutes.tsx'
import AdminRoutes from './routes/AdminRoutes.tsx'
import UserRoutes from './routes/UserRoutes.tsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PublicRoutes />
      <AdminRoutes />
      <UserRoutes />
    </BrowserRouter>
  </StrictMode>,
)
