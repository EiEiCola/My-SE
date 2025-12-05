import './index.css'
// import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button';


function App() {
  const navigate = useNavigate()
  return (
    <>
    <h1>Hello World สวัสดี</h1>
    
      <Button variant = "outlined" onClick={() => navigate('/login')}>
        ไปหน้า Login
      </Button>
    </>
  )
}

export default App
