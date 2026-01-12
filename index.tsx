
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Patch pointer capture methods to suppress InvalidStateError
// This error occurs in Three.js/OrbitControls when capturing a pointer that is no longer active.
if (typeof Element !== 'undefined') {
  const patch = (methodName: string) => {
    const original = (Element.prototype as any)[methodName];
    if (original) {
      (Element.prototype as any)[methodName] = function(pointerId: number) {
        try {
          original.call(this, pointerId);
        } catch (e: any) {
          if (e.name !== 'InvalidStateError') throw e;
        }
      };
    }
  };
  patch('setPointerCapture');
  patch('releasePointerCapture');
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
