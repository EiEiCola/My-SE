import '../../index.css'
// import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button';

function Login() {
    const navigate = useNavigate()
  return (
    <>
      <h1>หน้านี้คือ Login</h1>
      <p>1.</p>
        <Button variant = "outlined" onClick={() => navigate('/Admin')}>
         Admin
        </Button>
        <p>2.</p>
        <Button variant = "outlined" onClick={() => navigate('/User')}>
        User
      </Button>
       <p>3.</p>
       <Button variant = "outlined"onClick={() => navigate('/Register')}>
        Register
      </Button>
    </>
  )
}

export default Login