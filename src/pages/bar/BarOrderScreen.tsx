import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CategoriesNavBar from '../../components/CategoriesNavBar';
import ItemsGrid from '../../components/ItemsGrid';
import OrderSummaryPanel from '../../components/OrderSummaryPanel';
import ShiftControls from '../../components/ShiftControls';
import { useConfirm } from '../../components/ConfirmProvider';
import StyleSwitcher from '../../components/StyleSwitcher';
import '../OrderScreen.css';
import '../../components/CheckoutControls.css';

// Keep parity with existing OrderScreen layout constants
const BOTTOM_BAR_HEIGHT = 96; // px
const CATEGORIES_HEIGHT = 112; // px
const GAP_ABOVE_CHECKOUT = 12; // px
const ASIDE_WIDTH = 380; // px right panel

type Category = { id: number; name: string };
type Dish = { id: number; name: string; price: number; category_id: number };

type CartItem = { id: number; name: string; price: number; qty: number };

const BarOrderScreen: React.FC = () => {
  const confirm = useConfirm();
  const [shift, setShift] = useState<{ path: string; date: string } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(false);

  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [itemsOrder, setItemsOrder] = useState<number[]>([]);

  const addItem = (dish: Dish) => {
    setCart(prev => {
      const curr = prev[dish.id];
      const nextQty = curr ? curr.qty + 1 : 1;
      return { ...prev, [dish.id]: { id: dish.id, name: dish.name, price: dish.price, qty: nextQty } };
    });
    setItemsOrder(prev => (prev.includes(dish.id) ? prev : [...prev, dish.id]));
  };
  const removeOne = (id: number) => {
    setCart(prev => {
      const curr = prev[id];
      if (!curr) return prev;
      const next = { ...prev };
      if (curr.qty <= 1) {
        delete next[id];
        setItemsOrder(o => o.filter(x => x !== id));
      } else {
        next[id] = { ...curr, qty: curr.qty - 1 };
      }
      return next;
    });
  };
  const clearItem = (id: number) => {
    setCart(prev => { const next = { ...prev }; delete next[id]; return next; });
    setItemsOrder(prev => prev.filter(x => x !== id));
  };

  const itemsList = useMemo(() => itemsOrder.map(id => cart[id]).filter(Boolean), [itemsOrder, cart]);
  const subtotal = useMemo(() => itemsList.reduce((s, it) => s + it.price * it.qty, 0), [itemsList]);

  // Data loaders
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

  // Initial load + shift state
  useEffect(() => {
    loadCategories();
    (async () => {
      try { setShift(await window.db.getCurrentShift()); } catch { /* ignore */ }
    })();
  }, [loadCategories]);

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

  const pay = async (method: 'cash' | 'card') => {
    if (!itemsList.length) return;
    const confirmed = await confirm({
      message: 'Confirm Sale',
      detail: `Pay ${method === 'cash' ? 'Cash' : 'Card'} $${subtotal.toFixed(2)}?`,
      buttons: ['Cancel', 'Confirm']
    });
    if (confirmed !== 1) return;

    const items = itemsList.map(it => ({ dish_id: it.id, quantity: it.qty, price: it.price }));
    try {
      await window.db.quickSale(items, method);
      // reset cart
      setCart({});
      setItemsOrder([]);
    } catch (e: unknown) {
      console.error(e);
      await confirm({ message: 'Payment failed', detail: e instanceof Error ? e.message : String(e), buttons: ['OK'] });
    }
  };

  if (loadingCats && categories.length === 0) return <div className="order-screen__items">Loading menu…</div>;
  if (!categories.length) return <div className="order-screen__items">No categories found. Add categories in the database.</div>;

  return (
    <div className="order-screen__container">
      {/* Header with shift controls */}
      <div className="order-screen__header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 className="order-screen__title">Bar POS</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <StyleSwitcher />
          <ShiftControls shift={shift} onShiftChange={setShift} />
        </div>
      </div>

      {/* Items grid */}
      <div className="order-screen__items">
        <ItemsGrid dishes={dishes} loading={loadingDishes} onAdd={addItem} />
      </div>

      {/* Floating pay buttons (reuse styles) */}
      <div
        className="checkout-controls__actions"
        style={{ position: 'fixed', bottom: BOTTOM_BAR_HEIGHT + 12, right: ASIDE_WIDTH + 24 + 12, zIndex: 1100 }}
      >
        <div className="checkout-controls__pay-group">
          <button onClick={() => pay('cash')} className="checkout-controls__pay-btn checkout-controls__pay-btn--cash">
            Cash (${subtotal.toFixed(2)})
          </button>
          <button onClick={() => pay('card')} className="checkout-controls__pay-btn checkout-controls__pay-btn--card">
            Card (${subtotal.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Right order panel */}
      <OrderSummaryPanel
        items={itemsList}
        subtotal={subtotal}
        paymentMethod={null}
        selectedCategoryId={selectedCategory}
        bottomBarHeight={BOTTOM_BAR_HEIGHT}
        asideWidth={ASIDE_WIDTH + 24}
        onRemoveOne={(id) => removeOne(id)}
        onAddOne={(dish) => addItem(dish as unknown as Dish)}
        onClear={(id) => clearItem(id)}
      />

      {/* Bottom category bar */}
      <CategoriesNavBar
        categories={categories}
        selectedCategoryId={selectedCategory}
        onSelect={(id) => setSelectedCategory(id)}
        height={CATEGORIES_HEIGHT}
        bottomOffset={BOTTOM_BAR_HEIGHT + GAP_ABOVE_CHECKOUT}
      />
    </div>
  );
};

export default BarOrderScreen;
