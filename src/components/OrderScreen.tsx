import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

type Category = { id: number; name: string };
type Dish = { id: number; name: string; price: number; category_id: number };

const BOTTOM_BAR_HEIGHT = 96; // px
const ASIDE_WIDTH = 380; // px right panel

const OrderScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as unknown as { state?: { customerId?: number; phoneId?: number; customer?: { name:string; phone:string; address:string } } };
  const pending = location?.state;
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [orderItems, setOrderItems] = useState<Record<number, { id:number; name:string; price:number; qty:number }>>({});

  const addItem = (dish: Dish) => {
    setOrderItems((prev) => {
      const curr = prev[dish.id];
      const nextQty = curr ? curr.qty + 1 : 1;
      return { ...prev, [dish.id]: { id: dish.id, name: dish.name, price: dish.price, qty: nextQty } };
    });
  };
  const removeOne = (id: number) => {
    setOrderItems((prev) => {
      const curr = prev[id];
      if (!curr) return prev;
      const next = { ...prev };
      if (curr.qty <= 1) delete next[id]; else next[id] = { ...curr, qty: curr.qty - 1 };
      return next;
    });
  };
  const clearItem = (id: number) => {
    setOrderItems((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const itemsList = useMemo(() => Object.values(orderItems), [orderItems]);
  const subtotal = useMemo(() => itemsList.reduce((s, it) => s + it.price * it.qty, 0), [itemsList]);

  // Helpers
  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const result = await window.db.getCategories();
      setCategories(result);
      if (result?.length && selectedCategory == null) setSelectedCategory(result[0].id);
    } finally {
      setLoadingCats(false);
    }
  }, [selectedCategory]);
  const loadDishes = useCallback(async (catId: number) => {
    setLoadingDishes(true);
    try {
      const result = await window.db.getDishes(catId);
      setDishes(result);
    } finally {
      setLoadingDishes(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadCategories(); }, [loadCategories]);

  // Update dishes when category changes
  useEffect(() => { if (selectedCategory != null) loadDishes(selectedCategory); }, [selectedCategory, loadDishes]);

  // Refresh when data changes
  useEffect(() => {
    const off = window.db.onDataChanged(({ entity }) => {
      if (entity === 'category' || entity === 'dish') {
        loadCategories();
        if (selectedCategory != null) loadDishes(selectedCategory);
      }
    });
    return () => off();
  }, [selectedCategory, loadCategories, loadDishes]);

  const gridCols = useMemo(() => 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', []);

  if (loadingCats && categories.length === 0) return <div className="p-4">Loading menu…</div>;
  if (!categories.length) return <div className="p-4">No categories found. Add categories in the database.</div>;

  return (
    <div className="relative min-h-screen" style={{ paddingBottom: BOTTOM_BAR_HEIGHT, paddingRight: ASIDE_WIDTH + 24 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold">Order #{orderId}</h1>
        {selectedCategory != null && (
          <p className="text-sm text-gray-600">Viewing: {categories.find(c => c.id === selectedCategory)?.name}</p>
        )}
      </div>

      {/* Items grid */}
      <div className="p-4">
        {loadingDishes ? (
          <div>Loading items…</div>
        ) : dishes.length ? (
          <div className={`grid ${gridCols} gap-3`}>
            {dishes.map((dish) => (
              <button
                key={dish.id}
                className="h-24 rounded-lg shadow border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.99] text-left p-3"
                onClick={() => addItem(dish)}
              >
                <div className="font-semibold leading-tight line-clamp-2">{dish.name}</div>
                <div className="text-sm text-gray-600 mt-1">${dish.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-600">No items in this category.</div>
        )}
      </div>

      {/* Floating Back and Checkout buttons */}
      <div style={{ position: 'fixed', bottom: BOTTOM_BAR_HEIGHT + 12, left: 12, zIndex: 1100 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 16px',
            background: '#ef4444',
            color: '#ffffff',
            borderRadius: 8,
            border: '1px solid #ef4444',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>
      <div style={{ position: 'fixed', bottom: BOTTOM_BAR_HEIGHT + 12, right: ASIDE_WIDTH + 24 + 12, zIndex: 1100 }}>
        <button
          onClick={async () => {
            const amount = subtotal;
            // If we arrived via CustomerForm (no order yet), create it now
            if (pending?.customerId && pending?.phoneId) {
              const items = itemsList.map(it => ({ dish_id: it.id, quantity: it.qty, price: it.price }));
              try {
                await window.db.createOrderWithItems({ customerId: pending.customerId, phoneId: pending.phoneId, items });
              } catch (e) {
                console.error(e);
              }
            }
            navigate('/', { state: { orderPlaced: { amount } } });
          }}
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
          Checkout (${subtotal.toFixed(2)})
        </button>
      </div>

      {/* Right order panel */}
      <aside
        className="bg-white border-l"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: BOTTOM_BAR_HEIGHT,
          width: ASIDE_WIDTH,
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
          {itemsList.length === 0 ? (
            <div className="text-gray-500">No items yet.</div>
          ) : (
            <ul className="space-y-2">
              {itemsList.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 border rounded p-2 bg-white shadow-sm">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-gray-600">${it.price.toFixed(2)} × {it.qty}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeOne(it.id)} className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50" aria-label="Remove one">−</button>
                    <button onClick={() => addItem({ id: it.id, name: it.name, price: it.price, category_id: selectedCategory ?? 0 })} className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50" aria-label="Add one">+</button>
                    <button onClick={() => clearItem(it.id)} className="px-2 py-1 rounded border border-red-300 text-red-700 bg-white hover:bg-red-50" aria-label="Remove item">Remove</button>
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
        </div>
      </aside>

      {/* Bottom category bar */}
      <div style={{ height: BOTTOM_BAR_HEIGHT }} className="fixed bottom-0 left-0 right-0 bg-white border-t z-20">
        <div className="h-full overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-3 min-w-max">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontWeight: 600,
                  border: '2px solid ' + (selectedCategory === cat.id ? '#2563eb' : '#d1d5db'),
                  background: selectedCategory === cat.id ? '#2563eb' : '#ffffff',
                  color: selectedCategory === cat.id ? '#ffffff' : '#111827',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderScreen;
