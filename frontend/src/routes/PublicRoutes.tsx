import { Routes, Route } from 'react-router-dom'
import Home from '../app/App'
import Login from '../app/(public)/login'
import Register from '../app/(public)/register'
import ForgotPassword from '../app/(public)/login/forgotpassword'
import ResetPassword from '../app/(public)/login/resetpassword' 

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default PublicRoutes
