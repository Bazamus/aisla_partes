import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile-optimizations.css'
import './styles/nuevo-parte-mobile.css'
import './styles/mobile-search-optimizations.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
