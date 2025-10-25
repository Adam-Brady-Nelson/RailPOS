import React from 'react';

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
      className="bg-white border-l"
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
      <div className="px-4 py-3 border-b" style={{ flex: '0 0 auto' }}>
        <div className="text-lg font-semibold">Items</div>
        <div className="text-sm text-gray-600">Tap items to add to the order.</div>
      </div>
      <div className="p-3" style={{ flex: '1 1 auto', overflowY: 'auto', paddingBottom: 8 }}>
        {items.length === 0 ? (
          <div className="text-gray-500">No items yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 border rounded p-2 bg-white shadow-sm">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-gray-600">${it.price.toFixed(2)} × {it.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onRemoveOne(it.id)} className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50" aria-label="Remove one">−</button>
                  <button onClick={() => onAddOne({ id: it.id, name: it.name, price: it.price, category_id: selectedCategoryId ?? 0 })} className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50" aria-label="Add one">+</button>
                  <button onClick={() => onClear(it.id)} className="px-2 py-1 rounded border border-red-300 text-red-700 bg-white hover:bg-red-50" aria-label="Remove item">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t p-3 bg-white" style={{ flex: '0 0 auto' }}>
        <div className="flex items-center justify-between text-lg font-semibold" style={{ width: '100%' }}>
          <span>Total</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {paymentMethod && (
          <div className="text-sm text-gray-600 mt-1">Payment: <strong>{paymentMethod}</strong></div>
        )}
      </div>
    </aside>
  );
};

export default OrderSummaryPanel;
