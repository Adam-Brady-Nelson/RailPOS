import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StyleSwitcher from '../../components/StyleSwitcher';
import CategoriesNavBar from '../../components/CategoriesNavBar';
import ItemsGrid from '../../components/ItemsGrid';
import OrderSummaryPanel from '../../components/OrderSummaryPanel';
import BottomNav from '../../components/BottomNav';
import { useConfirm } from '../../components/ConfirmProvider';
import '../OrderScreen.css';
import '../../components/CheckoutControls.css';

// Layout constants to match existing screens
const BOTTOM_BAR_HEIGHT = 96; // px
const CATEGORIES_HEIGHT = 112; // px
const GAP_ABOVE_CHECKOUT = 12; // px
const ASIDE_WIDTH = 380; // px right panel

type Category = { id: number; name: string };
type Dish = { id: number; name: string; price: number; category_id: number };

type CartItem = { id: number; name: string; price: number; qty: number };


const RestaurantOrderScreen: React.FC = () => {
  const { orderId: orderIdParam } = useParams();
  const orderId = Number(orderIdParam);
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [dishesByCat, setDishesByCat] = useState<Map<number, Dish[]>>(new Map());
  const [dishIndex, setDishIndex] = useState<Map<number, Dish>>(new Map());
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(false);

  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [itemsOrder, setItemsOrder] = useState<number[]>([]);
  // Note: We prefill from order details but do not render the details panel here.

  const itemsList = useMemo(() => itemsOrder.map(id => cart[id]).filter(Boolean), [itemsOrder, cart]);
  const subtotal = useMemo(() => itemsList.reduce((s, it) => s + it.price * it.qty, 0), [itemsList]);

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

  const loadAllDishes = useCallback(async (cats: Category[]) => {
    setLoadingDishes(true);
    try {
      const map = new Map<number, Dish[]>();
      const idx = new Map<number, Dish>();
      for (const c of cats) {
        const dd = await window.db.getDishes(c.id);
        map.set(c.id, dd);
        for (const d of dd) idx.set(d.id, d);
      }
      setDishesByCat(map);
      setDishIndex(idx);
    } finally {
      setLoadingDishes(false);
    }
  }, []);

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
    setCart(prev => { const n = { ...prev }; delete n[id]; return n; });
    setItemsOrder(prev => prev.filter(x => x !== id));
  };

  // Initial load
  useEffect(() => {
    (async () => {
      await loadCategories();
    })();
  }, [loadCategories]);

  // When categories loaded, fetch all dishes for name lookup and prefill order items
  useEffect(() => {
    (async () => {
      if (!categories.length) return;
      await loadAllDishes(categories);
      try {
  const d = await window.db.getOrderDetails(orderId);
        if (d && d.items?.length) {
          setCart(() => {
            const next: Record<number, CartItem> = {};
            const order: number[] = [];
            for (const it of d.items) {
              const info = dishIndex.get(it.dish_id);
              const name = info?.name ?? `Item #${it.dish_id}`;
              const price = info?.price ?? it.price;
              next[it.dish_id] = { id: it.dish_id, name, price, qty: it.quantity };
              order.push(it.dish_id);
            }
            setItemsOrder(order);
            return next;
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, orderId]);

  const save = async () => {
    const items = itemsList.map(it => ({ dish_id: it.id, quantity: it.qty, price: it.price }));
    try {
      await window.db.updateOrderItems({ orderId, items });
      await confirm({ message: 'Saved', detail: 'Order items saved.', buttons: ['OK'] });
    } catch (e: unknown) {
      console.error(e);
      await confirm({ message: 'Save failed', detail: e instanceof Error ? e.message : String(e), buttons: ['OK'] });
    }
  };

  const pay = async (method: 'cash' | 'card') => {
    if (!itemsList.length) {
      const idx = await confirm({ message: 'Empty order', detail: 'No items to pay for. Save anyway?', buttons: ['Cancel', 'Save'] });
      if (idx === 1) await save();
      return;
    }
    const confirmed = await confirm({ message: 'Finalize Payment', detail: `Pay ${method.toUpperCase()} $${subtotal.toFixed(2)} and close table?`, buttons: ['Cancel', 'Confirm'] });
    if (confirmed !== 1) return;
    try {
      await window.db.finalizePayment({ orderId, payment_method: method });
      // Navigate back to the table grid; occupancy will update automatically via data-changed in other views
      navigate('/', { replace: true });
    } catch (e: unknown) {
      console.error(e);
      await confirm({ message: 'Payment failed', detail: e instanceof Error ? e.message : String(e), buttons: ['OK'] });
    }
  };

  const currentDishes = useMemo(() => (selectedCategory != null ? (dishesByCat.get(selectedCategory) ?? []) : []), [selectedCategory, dishesByCat]);

  if (loadingCats && categories.length === 0) return <div className="order-screen__items">Loading menu…</div>;

  return (
    <div className="order-screen__container">
      {/* Header */}
      <div className="order-screen__header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 className="order-screen__title">Table Order</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <StyleSwitcher />
        </div>
      </div>

      {/* Items grid */}
      <div className="order-screen__items">
        <ItemsGrid dishes={currentDishes} loading={loadingDishes} onAdd={addItem} />
      </div>

      {/* Floating actions: Save + Pay */}
      <div className="checkout-controls__actions" style={{ position: 'fixed', bottom: BOTTOM_BAR_HEIGHT + 12, right: ASIDE_WIDTH + 24 + 12, zIndex: 1100 }}>
        <div className="checkout-controls__pay-group">
          <button onClick={save} className="checkout-controls__pay-btn" style={{ background: '#111827', borderColor: '#111827' }}>
            Save
          </button>
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

      {/* Bottom navigation with right offset for aside */}
      <BottomNav rightOffset={ASIDE_WIDTH + 24} />
    </div>
  );
};

export default RestaurantOrderScreen;
