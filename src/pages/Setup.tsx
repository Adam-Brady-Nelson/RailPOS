import React from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import './Setup.css';

const Setup: React.FC = () => {
  return (
  <div className="setup-container">
      <div className="setup-back">
        <BackButton to="/">← Back</BackButton>
      </div>
      <h1 className="setup-title">Setup</h1>
      <div className="setup-links">
        <Link to="/menu" className="setup-link">
          Manage Menu (Categories & Items)
        </Link>
        <div className="setup-desc">This is a placeholder for setup/configuration options.</div>
      </div>
    </div>
  );
};

export default Setup;
