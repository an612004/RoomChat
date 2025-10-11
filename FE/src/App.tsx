import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LoginSuccess from './components/LoginSuccess'
import AdminPage from './pages/AdminPage'
import Notfound from './pages/Notfound'
import Home from './pages/Home'
import './index.css'

const App: React.FC = () => {
  // const ProtectedRoute = ({ children }) => {
  //   const { isAuthenticated } = useSelector(state => state.auth);
  //   return isAuthenticated ? children : <Navigate to="/login" />;
  // };

  // // Public Route Component (redirect if authenticated)
  // const PublicRoute = ({ children }) => {
  //   const { isAuthenticated } = useSelector(state => state.auth);
  //   return !isAuthenticated ? children : <Navigate to="/dashboard" />;
  // };
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/success" element={<LoginSuccess />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Notfound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App