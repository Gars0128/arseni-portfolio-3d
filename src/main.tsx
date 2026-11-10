import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { LitePage } from './lite/LitePage'

const App = lazy(() => import('./App'))

const hasWebGL = (() => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
})()
const lite = !hasWebGL || new URLSearchParams(location.search).has('lite')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {lite ? (
      <LitePage />
    ) : (
      <Suspense fallback={<div className="boot">booting…</div>}>
        <App />
      </Suspense>
    )}
  </StrictMode>,
)
