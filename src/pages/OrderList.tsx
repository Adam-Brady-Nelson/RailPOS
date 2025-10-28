import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrdersTable, { OrderRow } from '../components/OrdersTable';
import BackButton from '../components/BackButton';
import OrderDetailsPanel from '../components/OrderDetailsPanel';
import './OrderList.css';

const ASIDE_WIDTH = 420; // px

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<{
    order: { id:number; status:string; phone_id:number; fulfillment: 'delivery' | 'collection'; created_at:string };
    customer: { id:number; name:string; phone:string; address:string } | null;
    items: Array<{ dish_id:number; name:string; quantity:number; price:number }>;
    subtotal: number;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows = await window.db.getOrdersToday();
        setOrders(rows);
      } catch (e: unknown) {
        console.error(e);
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('NO_ACTIVE_SHIFT')) {
          setError('No active shift. Start a shift from the home screen.');
        } else {
          setError(msg || 'Failed to load orders');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    const off = window.db.onDataChanged(async ({ entity, id }) => {
      if (entity === 'order') {
        try {
          const rows = await window.db.getOrdersToday();
          setOrders(rows);
          if (selectedId != null && Number(id) === selectedId) {
            const d = await window.db.getOrderDetails(selectedId);
            setDetails(d);
          }
        } catch (e) { console.error(e); }
      }
    });
    return () => { off(); };
  }, [selectedId]);

  useEffect(() => {
    if (selectedId == null) { setDetails(null); return; }
    let ignore = false;
    const load = async () => {
      setLoadingDetails(true);
      try {
        const d = await window.db.getOrderDetails(selectedId);
        if (!ignore) setDetails(d);
      } catch (e) { console.error(e); }
      finally { setLoadingDetails(false); }
    };
    load();
    return () => { ignore = true; };
  }, [selectedId]);

  return (
    <div className="order-list__container">
      <div className="order-list__back">
        <BackButton to="/">← Back</BackButton>
      </div>
      <h1 className="order-list__title">Today's Orders</h1>
      {loading ? (
        <div>Loading orders…</div>
      ) : error ? (
        <div className="order-list__error">{error}</div>
      ) : orders.length === 0 ? (
        <div>No orders yet today.</div>
      ) : (
        <OrdersTable orders={orders} selectedId={selectedId} onSelect={setSelectedId} />
      )}
      {/* Right panel */}
      <OrderDetailsPanel
        selectedId={selectedId}
        details={details}
        loading={loadingDetails}
        width={ASIDE_WIDTH}
        onEdit={selectedId ? () => navigate(`/order/${selectedId}`) : undefined}
      />
    </div>
  );
};

export default OrderList;
