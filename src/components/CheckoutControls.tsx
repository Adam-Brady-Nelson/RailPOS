import React from 'react';
import BackButton from './BackButton';

interface Props {
  isEditingExisting: boolean;
  bottomBarHeight: number;
  asideWidth: number;
  backTo: string;
  onSaveChanges?: () => void | Promise<void>;
  onPayCash?: () => void | Promise<void>;
  onPayCard?: () => void | Promise<void>;
  subtotal: number;
}

const CheckoutControls: React.FC<Props> = ({
  isEditingExisting,
  bottomBarHeight,
  asideWidth,
  backTo,
  onSaveChanges,
  onPayCash,
  onPayCard,
  subtotal,
}) => {
  return (
    <>
      {/* Back button (standard component) */}
      <div style={{ position: 'fixed', bottom: bottomBarHeight + 12, left: 12, zIndex: 1100 }}>
        <BackButton to={backTo}>← Back</BackButton>
      </div>

      {/* Checkout / Save controls */}
      <div style={{ position: 'fixed', bottom: bottomBarHeight + 12, right: asideWidth + 24 + 12, zIndex: 1100 }}>
        {isEditingExisting ? (
          <button
            onClick={() => onSaveChanges && onSaveChanges()}
            style={{
              padding: '10px 16px',
              background: '#10b981',
              color: '#ffffff',
              borderRadius: 8,
              border: '1px solid #10b981',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save Changes
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onPayCash && onPayCash()}
              style={{ padding: '10px 16px', background: '#111827', color: '#fff', borderRadius: 8, border: '1px solid #111827', fontWeight: 600, cursor: 'pointer' }}
            >
              Cash (${subtotal.toFixed(2)})
            </button>
            <button
              onClick={() => onPayCard && onPayCard()}
              style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, border: '1px solid #2563eb', fontWeight: 600, cursor: 'pointer' }}
            >
              Card (${subtotal.toFixed(2)})
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CheckoutControls;
