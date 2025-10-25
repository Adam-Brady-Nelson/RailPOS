import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CategoriesNavBar from '../components/CategoriesNavBar';
import ItemsGrid from '../components/ItemsGrid';
import CheckoutControls from '../components/CheckoutControls';
import OrderSummaryPanel from '../components/OrderSummaryPanel';
import { useConfirm } from '../components/ConfirmProvider';

type Category = { id: number; name: string };
type Dish = { id: number; name: string; price: number; category_id: number };

const BOTTOM_BAR_HEIGHT = 96; // px
const ASIDE_WIDTH = 380; // px right panel

const OrderScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as unknown as { state?: { customerId?: number; phoneId?: number; customer?: { name:string; phone:string; address:string } } };
  const pending = location?.state;
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [orderItems, setOrderItems] = useState<Record<number, { id:number; name:string; price:number; qty:number }>>({});
  const [itemsOrder, setItemsOrder] = useState<number[]>([]); // Track insertion order
  const isEditingExisting = !!orderId && orderId !== 'new';
  const [loadingExisting, setLoadingExisting] = useState<boolean>(false);

  const addItem = (dish: Dish) => {
    setOrderItems((prev) => {
      const curr = prev[dish.id];
      const nextQty = curr ? curr.qty + 1 : 1;
      return { ...prev, [dish.id]: { id: dish.id, name: dish.name, price: dish.price, qty: nextQty } };
    });
    setItemsOrder((prev) => {
      if (!prev.includes(dish.id)) {
        return [...prev, dish.id];
      }
      return prev;
    });
  };
  const removeOne = (id: number) => {
    setOrderItems((prev) => {
      const curr = prev[id];
      if (!curr) return prev;
      const next = { ...prev };
      if (curr.qty <= 1) {
        delete next[id];
        setItemsOrder((prevOrder) => prevOrder.filter(itemId => itemId !== id));
      } else {
        next[id] = { ...curr, qty: curr.qty - 1 };
      }
      return next;
    });
  };
  const clearItem = (id: number) => {
    setOrderItems((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setItemsOrder((prev) => prev.filter(itemId => itemId !== id));
  };

  const itemsList = useMemo(() => itemsOrder.map(id => orderItems[id]).filter(Boolean), [itemsOrder, orderItems]);
  const subtotal = useMemo(() => itemsList.reduce((s, it) => s + it.price * it.qty, 0), [itemsList]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);

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

  // Load existing order items when editing
  useEffect(() => {
    let ignore = false;
    const loadExisting = async () => {
      if (!isEditingExisting) return;
      setLoadingExisting(true);
      try {
        const details = await window.db.getOrderDetails(Number(orderId));
        if (!details || ignore) return;
        const next: Record<number, { id:number; name:string; price:number; qty:number }> = {};
        const order: number[] = [];
        for (const it of details.items) {
          next[it.dish_id] = { id: it.dish_id, name: it.name, price: it.price, qty: it.quantity };
          order.push(it.dish_id);
        }
        setOrderItems(next);
        setItemsOrder(order);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingExisting(false);
      }
    };
    loadExisting();
    return () => { ignore = true; };
  }, [isEditingExisting, orderId]);

  // grid columns are handled inside ItemsGrid

  if (loadingCats && categories.length === 0) return <div className="p-4">Loading menu…</div>;
  if (loadingExisting) return <div className="p-4">Loading order…</div>;
  if (!categories.length) return <div className="p-4">No categories found. Add categories in the database.</div>;

  return (
    <div className="relative min-h-screen" style={{ paddingBottom: BOTTOM_BAR_HEIGHT, paddingRight: ASIDE_WIDTH + 24 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold">{isEditingExisting ? `Edit Order #${orderId}` : 'New Order'}</h1>
        {selectedCategory != null && (
          <p className="text-sm text-gray-600">Viewing: {categories.find(c => c.id === selectedCategory)?.name}</p>
        )}
      </div>

      {/* Items grid */}
      <div className="p-4">
        <ItemsGrid dishes={dishes} loading={loadingDishes} onAdd={addItem} />
      </div>

      {/* Floating Back and Checkout buttons */}
      <CheckoutControls
        isEditingExisting={isEditingExisting}
        bottomBarHeight={BOTTOM_BAR_HEIGHT}
        asideWidth={ASIDE_WIDTH + 24}
        backTo={isEditingExisting ? '/orders' : '/'}
        onSaveChanges={async () => {
          const items = itemsList.map(it => ({ dish_id: it.id, quantity: it.qty, price: it.price }));
          try {
            await window.db.updateOrderItems({ orderId: Number(orderId), items });
            navigate('/orders');
          } catch (e) { console.error(e); }
        }}
        onPayCash={async () => {
          const confirmed = await confirm({
            message: 'Confirm Order',
            detail: `Place order for $${subtotal.toFixed(2)} via Cash?`,
            buttons: ['Cancel', 'Place Order']
          });
          if (confirmed !== 1) return;
          setPaymentMethod('cash');
          const amount = subtotal;
          const items = itemsList.map(it => ({ dish_id: it.id, quantity: it.qty, price: it.price }));
          try {
            if (pending?.customerId && pending?.phoneId) {
              await window.db.createOrderWithItems({ customerId: pending.customerId, phoneId: pending.phoneId, items, payment_method: 'cash' });
            }
          } catch (e) { console.error(e); }
          navigate('/', { state: { orderPlaced: { amount } } });
        }}
        onPayCard={async () => {
          const confirmed = await confirm({
            message: 'Confirm Order',
            detail: `Place order for $${subtotal.toFixed(2)} via Card?`,
            buttons: ['Cancel', 'Place Order']
          });
          if (confirmed !== 1) return;
          setPaymentMethod('card');
          const amount = subtotal;
          const items = itemsList.map(it => ({ dish_id: it.id, quantity: it.qty, price: it.price }));
          try {
            if (pending?.customerId && pending?.phoneId) {
              await window.db.createOrderWithItems({ customerId: pending.customerId, phoneId: pending.phoneId, items, payment_method: 'card' });
            }
          } catch (e) { console.error(e); }
          navigate('/', { state: { orderPlaced: { amount } } });
        }}
        subtotal={subtotal}
      />

      {/* Right order panel */}
      <OrderSummaryPanel
        items={itemsList}
        subtotal={subtotal}
        paymentMethod={isEditingExisting ? paymentMethod : null}
        selectedCategoryId={selectedCategory}
        bottomBarHeight={BOTTOM_BAR_HEIGHT}
        asideWidth={ASIDE_WIDTH + 24}
        onRemoveOne={removeOne}
        onAddOne={(dish) => addItem(dish)}
        onClear={clearItem}
      />

      {/* Bottom category bar */}
      <CategoriesNavBar
        categories={categories}
        selectedCategoryId={selectedCategory}
        onSelect={(id) => setSelectedCategory(id)}
        height={BOTTOM_BAR_HEIGHT}
      />
    </div>
  );
};

export default OrderScreen;
