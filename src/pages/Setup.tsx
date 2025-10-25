import React from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const Setup: React.FC = () => {
  return (
    <div className="p-4">
      <div style={{ marginBottom: 12 }}>
        <BackButton to="/">← Back</BackButton>
      </div>
      <h1 className="text-2xl font-bold mb-4">Setup</h1>
      <div className="space-y-3">
        <Link
          to="/menu"
          style={{
            padding: '10px 14px',
            background: '#2563eb',
            color: '#ffffff',
            borderRadius: 8,
            border: '1px solid #2563eb',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Manage Menu (Categories & Items)
        </Link>
        <div className="text-gray-700">This is a placeholder for setup/configuration options.</div>
      </div>
    </div>
  );
};

export default Setup;
