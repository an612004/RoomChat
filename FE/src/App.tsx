import React, { useEffect, useState } from 'react'
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
import Profileuser from './pages/Profileuser';
import Splash from './components/Splash'
import { SocketProvider } from './contexts/SocketContext'
import { UserSyncProvider } from './contexts/UserSyncContext'
import { PostsProvider } from './contexts/PostsContext'

const App: React.FC = () => {
  const [splashVisible, setSplashVisible] = useState(false)

  useEffect(() => {
    // Show splash if a flag was set for full reload
    const flag = sessionStorage.getItem('showSplash')
    if (flag === '1') {
      setSplashVisible(true)
      // Clear the flag so subsequent navigations don't show it
      sessionStorage.removeItem('showSplash')
      setTimeout(() => setSplashVisible(false), 1200)
    }

    const handler = () => {
      setSplashVisible(true)
      setTimeout(() => setSplashVisible(false), 1200)
    }

    window.addEventListener('show-splash', handler as EventListener)
    return () => window.removeEventListener('show-splash', handler as EventListener)
  }, [])

  return (
    <>
      <Splash visible={splashVisible} />
      <UserSyncProvider>
        <SocketProvider>
          <PostsProvider>
            <BrowserRouter>
          <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/success" element={<LoginSuccess />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin612004" element={<AdminPage />} />
          <Route path="*" element={<Notfound />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/entertainment" element={<Entertainment />} />
          <Route path="/entertainment/home" element={<HomeE />} />
          <Route path="/trangchu/Trangchu" element={<Trangchu />} />
          <Route path="/profile" element={<Profileuser />} />
          </Routes>
            </BrowserRouter>
          </PostsProvider>
        </SocketProvider>
      </UserSyncProvider>
    </>
  )
}

export default App