import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// GLOBAL FETCH INTERCEPTOR for Session & Security
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const token = localStorage.getItem('cbt_session_token');

    // Only inject token for local API calls
    if (token && url.includes('localhost:3001/api') && !url.includes('/auth/login')) {
        let options: any = args[1] || {};
        const headers = new Headers(options.headers || {});
        if (!headers.has('Authorization')) {
            headers.append('Authorization', `Bearer ${token}`);
        }
        args[1] = { ...options, headers };
    }

    const response = await originalFetch(...args);

    // Auto-logout if session expires (401)
    if (response.status === 401 && !url.includes('/auth/login')) {
        localStorage.removeItem('cbt_user');
        localStorage.removeItem('cbt_session_token');
        if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?error=expired';
        }
    }
    
    return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
