import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MiniApp } from './pages/MiniApp';
import { StoreProvider } from './store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      {window.location.hash === '#mini' ? <MiniApp /> : <App />}
    </StoreProvider>
  </StrictMode>,
);
