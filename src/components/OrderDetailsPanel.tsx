import React from 'react';

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
      className="bg-white border-l"
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width, zIndex: 20, display: 'flex', flexDirection: 'column' }}
    >
      <div className="px-4 py-3 border-b" style={{ flex: '0 0 auto' }}>
        <div className="text-lg font-semibold">Order Details</div>
        {selectedId ? (
          <div className="text-sm text-gray-600">Order #{selectedId}</div>
        ) : (
          <div className="text-sm text-gray-600">Select an order to preview.</div>
        )}
      </div>
      <div className="p-3" style={{ flex: '1 1 auto', overflowY: 'auto' }}>
        {!selectedId ? (
          <div className="text-gray-500">No order selected.</div>
        ) : loading ? (
          <div>Loading…</div>
        ) : !details ? (
          <div className="text-gray-500">Order not found.</div>
        ) : (
          <div className="space-y-4">
            {details.customer && (
              <div className="border rounded p-2">
                <div className="font-semibold">Customer</div>
                <div className="text-sm text-gray-700">{details.customer.name}</div>
                <div className="text-sm text-gray-600">{details.customer.phone}</div>
              </div>
            )}
            <div>
              <div className="font-semibold mb-2">Items</div>
              {details.items.length === 0 ? (
                <div className="text-gray-500">No items.</div>
              ) : (
                <ul className="space-y-2">
                  {details.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between border rounded p-2 bg-white">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-sm text-gray-600">${it.price.toFixed(2)} × {it.quantity}</div>
                      </div>
                      <div className="font-semibold">${(it.price * it.quantity).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {onEdit && (
              <div>
                <button
                  onClick={onEdit}
                  className="px-3 py-2 rounded bg-blue-600 text-white border border-blue-700 hover:bg-blue-700"
                >
                  Edit this order
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="border-t p-3 bg-white" style={{ flex: '0 0 auto' }}>
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{details ? `$${details.subtotal.toFixed(2)}` : '$0.00'}</span>
        </div>
      </div>
    </aside>
  );
};

export default OrderDetailsPanel;
