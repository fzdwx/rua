import { useState, useEffect } from 'react'
import { initializeRuaAPI, type RuaAPI } from 'rua-api/browser'

function App() {
  const params = new URLSearchParams(window.location.search)
  const action = params.get('action')
  
  const [rua, setRua] = useState<RuaAPI | null>(null)
  const [result, setResult] = useState<string>('API results will appear here...')
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    // Initialize Rua API (extension info is fetched from host)
    initializeRuaAPI().then(api => {
      setRua(api)
      setResult(`Rua API ready! Extension: ${api.extension.id}`)
    }).catch(err => {
      setResult('Failed to initialize: ' + err.message)
    })
  }, [])

  const log = (message: string | object) => {
    const text = typeof message === 'object' ? JSON.stringify(message, null, 2) : message
    setResult(text)
    console.log('[hello-word]', message)
  }

  // Clipboard handlers
  const handleClipboardRead = async () => {
    if (!rua) return
    try {
      const text = await rua.clipboard.readText()
      log('Clipboard content: ' + text)
    } catch (e: unknown) {
      log('Error: ' + (e as Error).message)
    }
  }

  const handleClipboardWrite = async () => {
    if (!rua) return
    try {
      await rua.clipboard.writeText('Hello from Rua extension!')
      log('Written to clipboard: "Hello from Rua extension!"')
    } catch (e: unknown) {
      log('Error: ' + (e as Error).message)
    }
  }

  // Storage handlers (Rua-specific)
  const handleStorageSave = async () => {
    if (!rua) return
    try {
      const newCounter = counter + 1
      setCounter(newCounter)
      await rua.storage.set('counter', newCounter)
      log('Saved counter: ' + newCounter)
    } catch (e: unknown) {
      log('Error: ' + (e as Error).message)
    }
  }

  const handleStorageLoad = async () => {
    if (!rua) return
    try {
      const value = await rua.storage.get<number>('counter')
      setCounter(value || 0)
      log('Loaded counter: ' + (value || 0))
    } catch (e: unknown) {
      log('Error: ' + (e as Error).message)
    }
  }

  // UI handlers (Rua-specific)
  const handleHideInput = async () => {
    if (!rua) return
    try {
      await rua.ui.hideInput()
      log('Input hidden')
    } catch (e: unknown) {
      log('Error: ' + (e as Error).message)
    }
  }

  const handleShowInput = async () => {
    if (!rua) return
    try {
      await rua.ui.showInput()
      log('Input shown')
    } catch (e: unknown) {
      log('Error: ' + (e as Error).message)
    }
  }

  const handleClose = async () => {
    if (!rua) return
    try {
      await rua.ui.close()
    } catch (e: unknown) {
      log('Error: ' + (e as Error).message)
    }
  }

  // Notification handler
  const handleNotify = async () => {
    if (!rua) return
    try {
      await rua.notification.show({
        title: 'Hello from Extension!',
        body: 'This notification was sent from the hello-word extension.'
      })
      log('Notification sent')
    } catch (e: unknown) {
      log('Error: ' + (e as Error).message)
    }
  }

  return (
    <div className="container">
      <div>
        <h1>👋 Hello World!</h1>
        <p>Current action: {action || 'none'}</p>
      </div>

      <div className="section">
        <h3>Clipboard API</h3>
        <div className="button-group">
          <button onClick={handleClipboardRead}>Read Clipboard</button>
          <button onClick={handleClipboardWrite}>Write to Clipboard</button>
        </div>
      </div>

      <div className="section">
        <h3>Notification API</h3>
        <div className="button-group">
          <button onClick={handleNotify}>Show Notification</button>
        </div>
      </div>

      <div className="section">
        <h3>Storage API</h3>
        <div className="button-group">
          <button onClick={handleStorageSave}>Save Counter</button>
          <button onClick={handleStorageLoad}>Load Counter</button>
        </div>
      </div>

      <div className="section">
        <h3>UI Control API</h3>
        <div className="button-group">
          <button onClick={handleHideInput}>Hide Input</button>
          <button onClick={handleShowInput}>Show Input</button>
          <button className="secondary" onClick={handleClose}>Close Extension</button>
        </div>
      </div>

      <div className="section">
        <h3>Result</h3>
        <pre className="result">{result}</pre>
      </div>
    </div>
  )
}

export default App
