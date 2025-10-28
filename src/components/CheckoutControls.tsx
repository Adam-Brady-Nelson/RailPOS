import React from 'react';
import BackButton from './BackButton';
import './CheckoutControls.css';

interface Props {
  isEditingExisting: boolean;
  bottomBarHeight: number;
  asideWidth: number;
  backTo: string;
  onBackClick?: React.MouseEventHandler<HTMLDivElement>; // capture wrapper to allow confirmation without changing BackButton
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
  onBackClick,
  onSaveChanges,
  onPayCash,
  onPayCard,
  subtotal,
}) => {
  return (
    <>
      {/* Back button (standard component) */}
      <div
        className="checkout-controls__back"
        style={{ position: 'fixed', bottom: bottomBarHeight + 12, left: 12, zIndex: 1100 }}
        onClickCapture={onBackClick}
      >
        <BackButton to={backTo}>← Back</BackButton>
      </div>

      {/* Checkout / Save controls */}
      <div
        className="checkout-controls__actions"
        style={{ position: 'fixed', bottom: bottomBarHeight + 12, right: asideWidth + 24 + 12, zIndex: 1100 }}
      >
        {isEditingExisting ? (
          <button
            onClick={() => onSaveChanges && onSaveChanges()}
            className="checkout-controls__save-btn"
          >
            Save Changes
          </button>
        ) : (
          <div className="checkout-controls__pay-group">
            <button
              onClick={() => onPayCash && onPayCash()}
              className="checkout-controls__pay-btn checkout-controls__pay-btn--cash"
            >
              Cash (${subtotal.toFixed(2)})
            </button>
            <button
              onClick={() => onPayCard && onPayCard()}
              className="checkout-controls__pay-btn checkout-controls__pay-btn--card"
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
