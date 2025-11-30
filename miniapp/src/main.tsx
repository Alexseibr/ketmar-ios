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

const log = (msg: string) => {
  console.log('[Main]', msg);
  window.__KETMAR_LOG__?.(`[React] ${msg}`);
};

log('React app starting...');

const root = document.getElementById('root');
log(`Root element: ${root ? 'found' : 'NOT FOUND'}`);

if (!root) {
  log('ERROR: Root element not found!');
} else {
  log('Creating React root...');
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <BrowserRouter basename="/miniapp">
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    log('React render called successfully');
  } catch (err) {
    log(`React render ERROR: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}
