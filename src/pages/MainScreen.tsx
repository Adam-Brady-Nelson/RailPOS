import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmProvider';
import BottomNav from '../components/BottomNav';
import ShiftControls from '../components/ShiftControls';
import PhoneTile from '../components/PhoneTile';
import './MainScreen.css';

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
    <div className="main-screen__container">
      <div className="main-screen__content">
        <h1 className="main-screen__title">RailPOS</h1>
        <ShiftControls shift={shift} onShiftChange={setShift} />
        <div className="main-screen__phones">
          <PhoneTile phoneId={1} shiftActive={!!shift} />
          <PhoneTile phoneId={2} shiftActive={!!shift} />
        </div>
      </div>

      {/* Bottom nav bar */}
      <BottomNav />
    </div>
  );
};

export default MainScreen;
