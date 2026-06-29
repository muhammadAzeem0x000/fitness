import React from 'react';
import { createRoot } from 'react-dom/client';
import Model from 'react-body-highlighter';

const App = () => {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      <div style={{ width: '40px', height: '40px' }}>
        <Model
          data={[{ name: 'Chest', muscles: ['chest'] }]}
          style={{ width: '100%', height: '100%' }}
          highlightedColors={['#3b82f6']}
          type="anterior"
        />
      </div>
      <div style={{ width: '40px', height: '40px' }}>
        <Model
          data={[{ name: 'Back', muscles: ['lats', 'trapezius', 'lower-back'] }]}
          style={{ width: '100%', height: '100%' }}
          highlightedColors={['#3b82f6']}
          type="posterior"
        />
      </div>
    </div>
  );
};

// Assuming we run this in some way or just check if it compiles.
