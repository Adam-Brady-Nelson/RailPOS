import React, { useState } from 'react';
import { useConfirm } from './ConfirmProvider';
import './ShiftControls.css';

export type ShiftInfo = { path: string; date: string };

interface ShiftControlsProps {
  shift: ShiftInfo | null;
  onShiftChange: (shift: ShiftInfo | null) => void;
}

const ShiftControls: React.FC<ShiftControlsProps> = ({ shift, onShiftChange }) => {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const handleStartShift = async () => {
    if (busy || !!shift) return;
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
      onShiftChange(info);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start shift.';
      await confirm({ message: 'Failed to start shift', detail: msg, buttons: ['OK'] });
    } finally { setBusy(false); }
  };

  const handleCloseShift = async () => {
    if (busy || !shift) return;
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
      onShiftChange(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to close shift.';
      await confirm({ message: 'Failed to close shift', detail: msg, buttons: ['OK'] });
    } finally { setBusy(false); }
  };

  const startDisabled = !!shift || busy;
  const closeDisabled = !shift || busy;

  return (
    <div className="shift-controls">
      <button
        onClick={handleStartShift}
        disabled={startDisabled}
        className={`shift-btn shift-btn-start ${startDisabled ? 'shift-btn-start--disabled' : ''}`}
      >
        {shift ? `Shift active (${shift.date})` : 'Start Shift'}
      </button>
      <button
        onClick={handleCloseShift}
        disabled={closeDisabled}
        className={`shift-btn shift-btn-close ${closeDisabled ? 'shift-btn-close--disabled' : ''}`}
      >
        Close Shift
      </button>
    </div>
  );
};

export default ShiftControls;
