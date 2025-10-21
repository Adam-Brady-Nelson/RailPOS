import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmProvider';
import BottomNav from '../components/BottomNav';
import ShiftControls from '../components/ShiftControls';

const MainScreen: React.FC = () => {
  const [shift, setShift] = useState<{ path: string; date: string } | null>(null);
  const confirm = useConfirm();
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

  return (
    <div className="min-h-screen bg-gray-100" style={{ overflowY: 'hidden' }}>
      <div className="max-w-6xl mx-auto pt-12 px-4">
        <h1 className="text-5xl font-extrabold text-center mb-10">RailPOS</h1>
        <ShiftControls shift={shift} onShiftChange={setShift} />
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
      <BottomNav />
    </div>
  );
};

export default MainScreen;
