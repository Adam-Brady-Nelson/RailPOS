import React from 'react';
import { Link } from 'react-router-dom';
import { useConfirm } from './ConfirmProvider';
import './PhoneTile.css';

interface PhoneTileProps {
  phoneId: number;
  shiftActive: boolean;
}

const PhoneTile: React.FC<PhoneTileProps> = ({ phoneId, shiftActive }) => {
  const confirm = useConfirm();

  return (
    <Link
      to={`/customer-form/${phoneId}`}
      onClick={async (e) => {
        if (!shiftActive) {
          e.preventDefault();
          await confirm({
            message: 'No active shift',
            detail: 'Start a shift before taking orders.',
            buttons: ['OK']
          });
        }
      }}
      className="phone-tile flex items-center justify-center border-4 transition"
      aria-disabled={!shiftActive}
      data-testid={`phone-tile-${phoneId}`}
    >
      <span className="phone-tile__label text-center">{`Phone ${phoneId}`}</span>
    </Link>
  );
};

export default PhoneTile;
