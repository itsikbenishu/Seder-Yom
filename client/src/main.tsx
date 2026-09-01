import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import './i18n'
import App from './App.tsx'
import { queryClient } from './services/queryClient'
import { ToastProvider } from './components/ui'

// Theme is an account-level preference, fetched from the server only
// after the app mounts — there's no synchronous source for it pre-paint. Guess with
// the OS preference to avoid a flash of the wrong theme; `useAppTheme` corrects this
// once the real stored preference loads, same as the spec's own pre-auth fallback.
document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
