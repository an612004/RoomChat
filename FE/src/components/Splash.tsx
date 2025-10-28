import React from 'react'

interface SplashProps {
  visible: boolean
  message?: string
}

const Splash: React.FC<SplashProps> = ({ visible, message = 'Đang tải...' }) => {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      style={overlayStyle}
    >
      <div style={cardStyle}>
        <div style={logoWrapStyle}>
          <img src="/logo.png" alt="Anbi" style={logoStyle} />
        </div>
        <h1 style={titleStyle}>Anbi</h1>
        <div style={spinnerStyle} aria-hidden="true" />
        <div style={msgStyle}>{message}</div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, rgba(99,102,241,0.04) 30%, rgba(255,255,255,0.95) 100%)',
  zIndex: 9999,
}

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  padding: 28,
  borderRadius: 16,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,255,0.9))',
  boxShadow: '0 20px 60px rgba(34, 43, 69, 0.12)',
  minWidth: 260,
}

const logoWrapStyle: React.CSSProperties = {
  width: 110,
  height: 110,
  borderRadius: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #fff, rgba(245,245,255,0.8))',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
}

const logoStyle: React.CSSProperties = {
  width: 86,
  height: 86,
  borderRadius: 9999,
  objectFit: 'cover',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: '#111827',
}

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 18,
  border: '4px solid rgba(0,0,0,0.06)',
  borderTop: '4px solid #2563eb',
  animation: 'splash-spin 1s linear infinite',
}

const msgStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#374151',
}

// inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('splash-spin')) {
  const s = document.createElement('style')
  s.id = 'splash-spin'
  s.innerHTML = `@keyframes splash-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`
  document.head.appendChild(s)
}

export default Splash
