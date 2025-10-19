import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LoginSuccess from './components/LoginSuccess'
import AdminPage from './pages/Admin/AdminPage'
import Notfound from './pages/Notfound'
import Home from './pages/Home'
import './index.css'
import Chat from './pages/Chat'
import Entertainment from './pages/Entertainment'
import HomeE from'./pages/Entertainment/HomeE'
import Trangchu from './components/trangchu/Trangchu';

const App: React.FC = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        {/* <Route path="/" element={<Navigate to="/entertainment/home" replace />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/success" element={<LoginSuccess />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin612004" element={<AdminPage />} />
        <Route path="*" element={<Notfound />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/entertainment" element={<Entertainment />} />
        <Route path="/entertainment/home" element={<HomeE />} />
        <Route path="/trangchu/Trangchu" element={<Trangchu />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App