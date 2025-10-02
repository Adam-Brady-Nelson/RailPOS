import { useState } from 'react'

function App() {
  const [msg, setMsg] = useState<string>('')

  const handlePing = () => {
    try {
      const result = window.api?.ping?.()
      setMsg(String(result))
    } catch {
      setMsg('no api')
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>React + Vite + Electron</h1>
      <p>Click to call preload API:</p>
      <button onClick={handlePing}>Ping</button>
      {msg && <p>Response: {msg}</p>}
    </div>
  )
}

export default App
