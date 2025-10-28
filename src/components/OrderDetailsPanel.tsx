import React from 'react';
import './OrderDetailsPanel.css';

type OrderItem = { dish_id:number; name:string; quantity:number; price:number };
type Customer = { id:number; name:string; phone:string };

export interface OrderDetailsData {
  order: { id:number; status:string; phone_id:number; created_at:string };
  customer: Customer | null;
  items: OrderItem[];
  subtotal: number;
}

interface Props {
  selectedId: number | null;
  details: OrderDetailsData | null;
  loading: boolean;
  width?: number;
  onEdit?: () => void;
}

const OrderDetailsPanel: React.FC<Props> = ({ selectedId, details, loading, width = 420, onEdit }) => {
  return (
    <aside
      className="order-details-panel"
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width, zIndex: 20, display: 'flex', flexDirection: 'column' }}
    >
      <div className="order-details-panel__header" style={{ flex: '0 0 auto' }}>
        <div className="order-details-panel__title">Order Details</div>
        {selectedId ? (
          <div className="order-details-panel__subtitle">Order #{selectedId}</div>
        ) : (
          <div className="order-details-panel__subtitle">Select an order to preview.</div>
        )}
      </div>
  <div className="order-details-panel__body" style={{ flex: '1 1 auto', overflowY: 'auto' }}>
        {!selectedId ? (
          <div className="order-details-panel__empty">No order selected.</div>
        ) : loading ? (
          <div>Loading…</div>
        ) : !details ? (
          <div className="order-details-panel__empty">Order not found.</div>
        ) : (
          <div className="order-details-panel__content">
            {details.customer && (
              <div className="order-details-panel__customer">
                <div className="order-details-panel__customer-title">Customer</div>
                <div className="order-details-panel__customer-name">{details.customer.name}</div>
                <div className="order-details-panel__customer-phone">{details.customer.phone}</div>
              </div>
            )}
            <div>
              <div className="order-details-panel__items-title">Items</div>
              {details.items.length === 0 ? (
                <div className="order-details-panel__empty">No items.</div>
              ) : (
                <ul className="order-details-panel__items-list">
                  {details.items.map((it, idx) => (
                    <li key={idx} className="order-details-panel__item">
                      <div>
                        <div className="order-details-panel__item-name">{it.name}</div>
                        <div className="order-details-panel__item-price">${it.price.toFixed(2)} × {it.quantity}</div>
                      </div>
                      <div className="order-details-panel__item-total">${(it.price * it.quantity).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {onEdit && (
              <div>
                <button
                  onClick={onEdit}
                  className="order-details-panel__edit-btn"
                >
                  Edit this order
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="order-details-panel__footer" style={{ flex: '0 0 auto' }}>
        <div className="order-details-panel__total-row">
          <span>Total</span>
          <span>{details ? `$${details.subtotal.toFixed(2)}` : '$0.00'}</span>
        </div>
      </div>
    </aside>
  );
};

export default OrderDetailsPanel;
