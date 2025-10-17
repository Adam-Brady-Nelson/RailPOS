import React from 'react';
import { Link } from 'react-router-dom';

const Setup: React.FC = () => {
  return (
    <div className="p-4">
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/"
          style={{
            padding: '8px 12px',
            background: '#111827',
            color: '#ffffff',
            borderRadius: 8,
            border: '1px solid #111827',
            cursor: 'pointer',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          ← Back
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Setup</h1>
      <div className="text-gray-700">This is a placeholder for setup/configuration options.</div>
    </div>
  );
};

export default Setup;
