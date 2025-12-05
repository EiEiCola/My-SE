
import "./index.css";
// import { Link } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
function HomeUser() {
  const navigate = useNavigate();
  return (
    <>
      <main className="flex-1 overflow-y-auto bg-transparent">
               <h1>Hello World สวัสดี User</h1>
      </main>
    </>
  );
}

export default HomeUser;
