import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfirm } from './ConfirmProvider';

const MainScreen: React.FC = () => {
  const [shift, setShift] = useState<{ path: string; date: string } | null>(null);
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const location = useLocation() as unknown as { state: { orderPlaced?: { amount: number } } | null };

  useEffect(() => {
    (async () => {
      try {
        const current = await window.db.getCurrentShift();
        setShift(current);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Show order placed message when returning from checkout
  useEffect(() => {
    const placed = location?.state?.orderPlaced;
    if (placed && typeof placed.amount === 'number') {
      // Clear the state so it doesn't re-show on navigation
      history.replaceState({}, '');
      confirm({ message: 'Order placed!', detail: `Price $${placed.amount.toFixed(2)}`, buttons: ['OK'] });
    }
  }, [location?.state, confirm]);

  const handleStartShift = async () => {
    if (busy) return;
    // Guard for browser live view where preload isn't available
    if (!('db' in window) || typeof window.db.startShift !== 'function') {
      await confirm({
        message: 'Start Shift unavailable in browser',
        detail: 'This action requires the Electron runtime. Run "npm run dev" and use the Electron window.',
        buttons: ['OK']
      });
      return;
    }
    const response = await confirm({ message: 'Start a new shift?', detail: 'This will create a new orders database for today.', buttons: ['Cancel', 'Start Shift'] });
    if (response !== 1) return;
    try {
      setBusy(true);
      const info = await window.db.startShift();
      setShift(info);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start shift.';
      await confirm({ message: 'Failed to start shift', detail: msg, buttons: ['OK'] });
    } finally { setBusy(false); }
  };

  return (
  <div className="min-h-screen bg-gray-100" style={{ overflowY: 'hidden' }}>
      <div className="max-w-6xl mx-auto pt-12 px-4">
        <h1 className="text-5xl font-extrabold text-center mb-10">RailPOS</h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, gap: 16 }}>
          <button
            onClick={handleStartShift}
            disabled={!!shift}
            style={{
              padding: '8px 14px',
              background: shift ? '#9ca3af' : '#2563eb',
              color: '#fff',
              borderRadius: 8,
              border: '1px solid ' + (shift ? '#9ca3af' : '#2563eb'),
              cursor: shift ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {shift ? `Shift active (${shift.date})` : 'Start Shift'}
          </button>
          <button
            onClick={async () => {
              if (busy) return;
              // Guard for browser live view where preload isn't available
              if (!('db' in window) || typeof window.db.closeShift !== 'function') {
                await confirm({
                  message: 'Close Shift unavailable in browser',
                  detail: 'This action requires the Electron runtime. Run "npm run dev" and use the Electron window.',
                  buttons: ['OK']
                });
                return;
              }
              const response = await confirm({ message: 'Close the current shift?', detail: 'This will disable order entry until a new shift is started.', buttons: ['Cancel', 'Close Shift'] });
              if (response !== 1) return;
              try {
                setBusy(true);
                await window.db.closeShift();
                setShift(null);
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to close shift.';
                await confirm({ message: 'Failed to close shift', detail: msg, buttons: ['OK'] });
              } finally { setBusy(false); }
            }}
            disabled={!shift}
            style={{
              padding: '8px 14px',
              background: !shift ? '#9ca3af' : '#ef4444',
              color: '#fff',
              borderRadius: 8,
              border: '1px solid ' + (!shift ? '#9ca3af' : '#ef4444'),
              cursor: !shift ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            Close Shift
          </button>
        </div>
        <div className="flex justify-center" style={{ gap: '6rem' }}>
          <Link
            to="/customer-form/1"
            onClick={async (e) => {
              if (!shift) {
                e.preventDefault();
                await confirm({
                  message: 'No active shift',
                  detail: 'Start a shift before taking orders.',
                  buttons: ['OK']
                });
              }
            }}
            className="flex items-center justify-center border-4 transition"
            style={{
              width: 320,
              height: 320,
              background: '#ffffff',
              borderColor: '#d1d5db',
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              opacity: shift ? 1 : 0.6,
              cursor: shift ? 'pointer' : 'not-allowed'
            }}
            aria-disabled={!shift}
          >
            <span className="text-center" style={{ fontSize: '2.25rem', fontWeight: 600, color: '#1f2937' }}>Phone 1</span>
          </Link>
          <Link
            to="/customer-form/2"
            onClick={async (e) => {
              if (!shift) {
                e.preventDefault();
                await confirm({
                  message: 'No active shift',
                  detail: 'Start a shift before taking orders.',
                  buttons: ['OK']
                });
              }
            }}
            className="flex items-center justify-center border-4 transition"
            style={{
              width: 320,
              height: 320,
              background: '#ffffff',
              borderColor: '#d1d5db',
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              opacity: shift ? 1 : 0.6,
              cursor: shift ? 'pointer' : 'not-allowed'
            }}
            aria-disabled={!shift}
          >
            <span className="text-center" style={{ fontSize: '2.25rem', fontWeight: 600, color: '#1f2937' }}>Phone 2</span>
          </Link>
        </div>
      </div>

      {/* Bottom nav bar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          padding: '12px 16px',
          zIndex: 50,
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        {(() => {
          const navBtnStyle: React.CSSProperties = {
            padding: '10px 16px',
            background: '#111827',
            color: '#ffffff',
            borderRadius: 8,
            border: '1px solid #111827',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'inline-block',
            textDecoration: 'none',
          };
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/orders" style={navBtnStyle}>Order List</Link>
                <Link to="/totals" style={navBtnStyle}>Daily totals</Link>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <Link to="/setup" style={navBtnStyle}>Setup</Link>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default MainScreen;
