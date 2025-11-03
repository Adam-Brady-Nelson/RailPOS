import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ShiftControls from '../components/ShiftControls';
import './Setup.css';

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [dbPresent, setDbPresent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Array<'TAKEAWAY' | 'BAR' | 'RESTAURANT'>>(['TAKEAWAY']);
  const [active, setActive] = useState<'TAKEAWAY' | 'BAR' | 'RESTAURANT'>('TAKEAWAY');
  const [shift, setShift] = useState<{ path: string; date: string } | null>(null);

  const handleInitialize = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
  // Persist chosen styles first (no-op in browser-only runs)
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
      try {
        const current = await window.db.getCurrentShift();
        setShift(current);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await window.settings?.get?.();
        if (s) {
          setEnabled(s.enabledStyles ?? [(s.style as 'TAKEAWAY' | 'BAR' | 'RESTAURANT') ?? 'TAKEAWAY']);
          setActive(s.activeStyle ?? (s.style as 'TAKEAWAY' | 'BAR' | 'RESTAURANT') ?? 'TAKEAWAY');
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // Keep active selection valid when enabled list changes
  useEffect(() => {
    if (!enabled.includes(active)) {
      setActive(enabled[0] ?? 'TAKEAWAY');
    }
  }, [enabled, active]);

  // Persist settings live when toggles change (no need to re-initialize DB)
  useEffect(() => {
    (async () => {
      try {
        await window.settings?.set?.({ enabledStyles: enabled, activeStyle: active });
      } catch { /* ignore */ }
    })();
  }, [enabled, active]);

  return (
  <div className="setup-container">
      <div className="setup-back">
        <BackButton to="/">← Back</BackButton>
      </div>
      <h1 className="setup-title">Setup</h1>
      {/* Global Shift Controls moved here */}
      <div style={{ margin: '8px 0 16px' }}>
        <ShiftControls shift={shift} onShiftChange={setShift} />
      </div>
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
        <label style={{ display: 'block', marginTop: 6 }}>
          <input
            type="checkbox"
            checked={enabled.includes('RESTAURANT')}
            onChange={(e) => {
              setEnabled(prev => e.target.checked ? Array.from(new Set([...prev, 'RESTAURANT'])) : prev.filter(s => s !== 'RESTAURANT'))
            }}
          />{' '}
          Restaurant (Table grid + Layout editor)
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Default Active System</div>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as 'TAKEAWAY' | 'BAR' | 'RESTAURANT')}
          disabled={enabled.length === 0}
        >
          {enabled.includes('TAKEAWAY') && <option value="TAKEAWAY">Takeaway</option>}
          {enabled.includes('BAR') && <option value="BAR">Bar</option>}
          {enabled.includes('RESTAURANT') && <option value="RESTAURANT">Restaurant</option>}
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
        {enabled.includes('RESTAURANT') && (
          <Link to={"/restaurant-layout"} className="setup-link">
            Restaurant Layout
          </Link>
        )}
        <div className="setup-desc">This is a placeholder for setup/configuration options.</div>
      </div>
    </div>
  );
};

export default Setup;
