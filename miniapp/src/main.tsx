import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

console.log('[Main] React app starting...');

const root = document.getElementById('root');
console.log('[Main] Root element:', root);

if (!root) {
  console.error('[Main] Root element not found!');
} else {
  console.log('[Main] Creating React root...');
}

ReactDOM.createRoot(root as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename="/miniapp">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
