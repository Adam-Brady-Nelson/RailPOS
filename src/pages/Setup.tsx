import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import './Setup.css';

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [dbPresent, setDbPresent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Array<'TAKEAWAY' | 'BAR'>>(['TAKEAWAY']);
  const [active, setActive] = useState<'TAKEAWAY' | 'BAR'>('TAKEAWAY');

  const handleInitialize = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
  // Persist chosen styles first
  // @ts-ignore optional in browser
  await window.settings?.set?.({ enabledStyles: enabled, activeStyle: active });
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
  }, [navigate, enabled, active]);

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

  useEffect(() => {
    (async () => {
      try {
        // @ts-ignore
        const s = await window.settings?.get?.();
        if (s) {
          setEnabled(s.enabledStyles ?? [(s.style as 'TAKEAWAY' | 'BAR') ?? 'TAKEAWAY']);
          setActive(s.activeStyle ?? (s.style as 'TAKEAWAY' | 'BAR') ?? 'TAKEAWAY');
        }
      } catch { /* ignore */ }
    })();
  }, []);

  return (
  <div className="setup-container">
      <div className="setup-back">
        <BackButton to="/">← Back</BackButton>
      </div>
      <h1 className="setup-title">Setup</h1>
      <p style={{ marginTop: 8, marginBottom: 16 }}>Looks like this is your first time. Initialize the database to get started.</p>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Enable POS Systems</div>
        <label style={{ display: 'block', marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={enabled.includes('TAKEAWAY')}
            onChange={(e) => {
              setEnabled(prev => e.target.checked ? Array.from(new Set([...prev, 'TAKEAWAY'])) : prev.filter(s => s !== 'TAKEAWAY'))
            }}
          />{' '}
          Takeaway (Customers, Delivery/Collection)
        </label>
        <label style={{ display: 'block' }}>
          <input
            type="checkbox"
            checked={enabled.includes('BAR')}
            onChange={(e) => {
              setEnabled(prev => e.target.checked ? Array.from(new Set([...prev, 'BAR'])) : prev.filter(s => s !== 'BAR'))
            }}
          />{' '}
          Bar (Single Screen, Quick Sale)
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Default Active System</div>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as 'TAKEAWAY' | 'BAR')}
          disabled={enabled.length === 0}
        >
          {enabled.includes('TAKEAWAY') && <option value="TAKEAWAY">Takeaway</option>}
          {enabled.includes('BAR') && <option value="BAR">Bar</option>}
        </select>
      </div>
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
