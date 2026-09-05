import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global stylesheet: Tailwind base + shadcn/ui design tokens + component utilities
import './index.css';

// Mount the React application into the <div id="root"> in index.html.
// React.StrictMode enables additional runtime checks and warnings in development
// (double-invokes lifecycle methods and hooks to surface side-effect bugs).
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

