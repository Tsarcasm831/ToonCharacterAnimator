
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GlobalProvider } from './contexts/GlobalContext';

// Patch setPointerCapture and releasePointerCapture to suppress InvalidStateError
// This error commonly occurs in Three.js/React applications (OrbitControls, etc.) when 
// controls are disabled or components unmount while a pointer interaction is active.
if (typeof Element !== 'undefined') {
  const patch = (methodName: string) => {
    const original = (Element.prototype as any)[methodName];
    if (original) {
      (Element.prototype as any)[methodName] = function(pointerId: number) {
        try {
          original.call(this, pointerId);
        } catch (e: any) {
          // Only suppress InvalidStateError, rethrow others for debugging
          if (e.name !== 'InvalidStateError') {
            throw e;
          }
        }
      };
    }
  };
  patch('setPointerCapture');
  patch('releasePointerCapture');
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Failed to find the root element. Ensure index.html has a <div id='root'></div>");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <GlobalProvider>
          <App />
        </GlobalProvider>
      </React.StrictMode>
    );
  } catch (err) {
    console.error("React rendering error:", err);
  }
}
