import React from 'react';
import { Link } from 'react-router-dom';

const MainScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto pt-12 px-4">
        <h1 className="text-5xl font-extrabold text-center mb-10">RailPOS</h1>
        <div className="flex justify-center" style={{ gap: '6rem' }}>
          <Link
            to="/customer-form/1"
            className="flex items-center justify-center border-4 transition"
            style={{
              width: 320,
              height: 320,
              background: '#ffffff',
              borderColor: '#d1d5db',
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              textDecoration: 'none'
            }}
          >
            <span className="text-center" style={{ fontSize: '2.25rem', fontWeight: 600, color: '#1f2937' }}>Phone 1</span>
          </Link>
          <Link
            to="/customer-form/2"
            className="flex items-center justify-center border-4 transition"
            style={{
              width: 320,
              height: 320,
              background: '#ffffff',
              borderColor: '#d1d5db',
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              textDecoration: 'none'
            }}
          >
            <span className="text-center" style={{ fontSize: '2.25rem', fontWeight: 600, color: '#1f2937' }}>Phone 2</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainScreen;
