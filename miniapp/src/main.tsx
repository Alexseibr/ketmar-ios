import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

declare global {
  interface Window {
    __KETMAR_LOG__?: (msg: string) => void;
  }
}

console.log('[MAIN] Script loaded at top level');

const log = (msg: string) => {
  console.log('[Main]', msg);
  window.__KETMAR_LOG__?.(`[React] ${msg}`);
};

log('React app starting...');

const root = document.getElementById('root');
log(`Root element: ${root ? 'found' : 'NOT FOUND'}`);

if (!root) {
  log('ERROR: Root element not found!');
  const err = document.createElement('div');
  err.innerHTML = '<h1 style="color:red">Root not found!</h1>';
  document.body.appendChild(err);
} else {
  log('Creating React root...');
  try {
    const reactRoot = ReactDOM.createRoot(root);
    
    log('Rendering App component...');
    
    reactRoot.render(
      <React.StrictMode>
        <BrowserRouter basename="/miniapp">
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    log('React render called successfully');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`React render ERROR: ${msg}`);
    console.error('React render error:', err);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:20px;background:red;color:white;z-index:99999';
    errorDiv.innerHTML = `<strong>React Error:</strong> ${msg}`;
    document.body.appendChild(errorDiv);
    
    throw err;
  }
}

console.log('[MAIN] Script finished');
