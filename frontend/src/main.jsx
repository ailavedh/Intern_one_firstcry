import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global fetch interceptor to support remote API endpoints in production
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  if (typeof url === 'string' && (url.startsWith('/api') || url.startsWith('/uploads'))) {
    url = `${baseUrl}${url}`;
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
