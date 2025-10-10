import LoginPage from './pages/LoginPage'
import LoginSuccess from './components/LoginSuccess'
import AdminPage from './pages/AdminPage'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; 
import Notfound from './pages/Notfound';
import Home from './pages/Home';

function App(){
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated } = useSelector(state => state.auth);
//   return isAuthenticated ? children : <Navigate to="/login" />;
// };

// // Public Route Component (redirect if authenticated)
// const PublicRoute = ({ children }) => {
//   const { isAuthenticated } = useSelector(state => state.auth);
//   return !isAuthenticated ? children : <Navigate to="/dashboard" />;
// };
  return(
    <BrowserRouter>
     <Routes>
      <Route path="/" element={<LoginPage />}/>
      <Route path="/login" element={<LoginPage />}/>
      <Route path="/login/success" element={<LoginSuccess />}/>
      <Route path="/home" element={<Home />}/>
      <Route path="/admin" element={<AdminPage />}/>
      <Route path="*" element={<Notfound />}/>
     </Routes>
    </BrowserRouter>
  )
}
// function App() {

//   return (
//    <div className="container">
//      <h1>Welcome to anbi</h1>
//      <div className="logo">
//        <img src="../public/logo.png" alt="Vite logo" />
//      </div>
//      <Login />
//    </div>
//   )
// }

export default App
