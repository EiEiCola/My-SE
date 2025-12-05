import { Routes, Route } from 'react-router-dom'
import Home from '../app/App'
import Login from '../app/(public)/login'
import Register from '../app/(public)/register'

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default PublicRoutes
