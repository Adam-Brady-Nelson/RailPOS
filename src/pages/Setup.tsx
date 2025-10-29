import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import './Setup.css';

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [dbPresent, setDbPresent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
  await window.db.initializeDb();
  setDbPresent(true);
      // After creating schema, route to main screen
      navigate('/', { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setBusy(false);
    }
  }, [navigate]);

  React.useEffect(() => {
    (async () => {
      try {
        const present = await window.db.isDbPresent();
        setDbPresent(present);
      } catch {
        setDbPresent(false);
      }
    })();
  }, []);

  return (
  <div className="setup-container">
      <div className="setup-back">
        <BackButton to="/">← Back</BackButton>
      </div>
      <h1 className="setup-title">Setup</h1>
      <p style={{ marginTop: 8, marginBottom: 16 }}>Looks like this is your first time. Initialize the database to get started.</p>
      <button onClick={handleInitialize} className="setup-link" disabled={busy}>
        {busy ? 'Initializing…' : 'Initialize Database'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <div className="setup-links">
        <Link to={dbPresent ? "/menu" : "#"} className="setup-link" onClick={(e) => { if (!dbPresent) e.preventDefault(); }} style={!dbPresent ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
          Manage Menu (Categories & Items)
        </Link>
        <div className="setup-desc">This is a placeholder for setup/configuration options.</div>
      </div>
    </div>
  );
};

export default Setup;
