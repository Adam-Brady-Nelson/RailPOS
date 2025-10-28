import React from 'react';
import './OrderSummaryPanel.css';

export type OrderItem = { id: number; name: string; price: number; qty: number };
export type DishLike = { id: number; name: string; price: number; category_id: number };

interface Props {
  items: OrderItem[];
  subtotal: number;
  paymentMethod: 'cash' | 'card' | null;
  selectedCategoryId: number | null;
  bottomBarHeight: number;
  asideWidth: number;
  onRemoveOne: (id: number) => void;
  onAddOne: (dish: DishLike) => void;
  onClear: (id: number) => void;
}

const OrderSummaryPanel: React.FC<Props> = ({
  items,
  subtotal,
  paymentMethod,
  selectedCategoryId,
  bottomBarHeight,
  asideWidth,
  onRemoveOne,
  onAddOne,
  onClear,
}) => {
  return (
    <aside
      className="order-summary-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: bottomBarHeight,
        width: asideWidth - 24, // page passes ASIDE_WIDTH + 24, adjust back to panel width
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
      }}
    >
      <div className="order-summary-panel__header" style={{ flex: '0 0 auto' }}>
        <div className="order-summary-panel__title">Items</div>
        <div className="order-summary-panel__subtitle">Tap items to add to the order.</div>
      </div>
      <div className="order-summary-panel__body" style={{ flex: '1 1 auto', overflowY: 'auto', paddingBottom: 8 }}>
        {items.length === 0 ? (
          <div className="order-summary-panel__empty">No items yet.</div>
        ) : (
          <ul className="order-summary-panel__list">
            {items.map((it) => (
              <li key={it.id} className="order-summary-panel__item">
                <div>
                  <div className="order-summary-panel__item-name">{it.name}</div>
                  <div className="order-summary-panel__item-price">${it.price.toFixed(2)} × {it.qty}</div>
                </div>
                <div className="order-summary-panel__item-actions">
                  <button onClick={() => onRemoveOne(it.id)} className="order-summary-panel__btn order-summary-panel__btn--qty" aria-label="Remove one">−</button>
                  <button onClick={() => onAddOne({ id: it.id, name: it.name, price: it.price, category_id: selectedCategoryId ?? 0 })} className="order-summary-panel__btn order-summary-panel__btn--qty" aria-label="Add one">+</button>
                  <button onClick={() => onClear(it.id)} className="order-summary-panel__btn order-summary-panel__btn--remove" aria-label="Remove item">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="order-summary-panel__footer" style={{ flex: '0 0 auto' }}>
        <div className="order-summary-panel__total-row">
          <span>Total</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {paymentMethod && (
          <div className="order-summary-panel__payment">Payment: <strong>{paymentMethod}</strong></div>
        )}
      </div>
    </aside>
  );
};

export default OrderSummaryPanel;
