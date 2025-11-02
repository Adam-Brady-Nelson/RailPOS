import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid #ddd',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#fff',
};
const btn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  background: '#f3f4f6',
};
const btnActive: React.CSSProperties = {
  ...btn,
  background: '#111827',
  color: '#fff',
};

export default function StyleSwitcher() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState<Array<'TAKEAWAY' | 'BAR'>>([]);
  const [active, setActive] = useState<'TAKEAWAY' | 'BAR'>('TAKEAWAY');

  useEffect(() => {
    let off = () => {};
    (async () => {
      try {
        const s = await window.settings.get();
        setEnabled(s.enabledStyles);
        setActive(s.activeStyle ?? (s.style as 'TAKEAWAY' | 'BAR') ?? 'TAKEAWAY');
        off = window.settings.onChanged(ns => {
          setEnabled(ns.enabledStyles);
          setActive(ns.activeStyle ?? (ns.style as 'TAKEAWAY' | 'BAR') ?? 'TAKEAWAY');
        });
      } catch { /* ignore */ }
    })();
    return () => off();
  }, []);

  const change = async (next: 'TAKEAWAY' | 'BAR') => {
    if (next === active) return;
    await window.settings.set({ activeStyle: next });
    navigate('/', { replace: true });
  };

  if (!enabled || enabled.length <= 1) return null;

  return (
    <div style={pill}>
      {enabled.includes('TAKEAWAY') && (
        <button
          style={active === 'TAKEAWAY' ? btnActive : btn}
          onClick={() => change('TAKEAWAY')}
          title="Switch to Takeaway"
        >
          Takeaway
        </button>
      )}
      {enabled.includes('BAR') && (
        <button
          style={active === 'BAR' ? btnActive : btn}
          onClick={() => change('BAR')}
          title="Switch to Bar"
        >
          Bar
        </button>
      )}
    </div>
  );
}
