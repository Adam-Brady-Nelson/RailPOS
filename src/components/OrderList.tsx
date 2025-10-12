import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface OrderRow {
  id: number;
  created_at: string;
  status: string;
  phone_id: number;
  customer_name?: string;
  customer_phone?: string;
  total: number;
}

const ASIDE_WIDTH = 420; // px

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<{
    order: { id:number; status:string; phone_id:number; created_at:string };
    customer: { id:number; name:string; phone:string } | null;
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
  <div className="p-4" style={{ paddingRight: ASIDE_WIDTH + 24 }}>
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/"
          style={{
            padding: '8px 12px',
            background: '#111827',
            color: '#ffffff',
            borderRadius: 8,
            border: '1px solid #111827',
            cursor: 'pointer',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          ← Back
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Today's Orders</h1>
      {loading ? (
        <div>Loading orders…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : orders.length === 0 ? (
        <div>No orders yet today.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left">#</th>
                <th className="border p-2 text-left">Time</th>
                <th className="border p-2 text-left">Customer</th>
                <th className="border p-2 text-left">Phone</th>
                <th className="border p-2 text-left">Phone ID</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className={"cursor-pointer hover:bg-gray-50 " + (selectedId === o.id ? 'bg-blue-50' : '')} onClick={() => setSelectedId(o.id)}>
                  <td className="border p-2">{o.id}</td>
                  <td className="border p-2">{new Date(o.created_at).toLocaleTimeString()}</td>
                  <td className="border p-2">{o.customer_name ?? '—'}</td>
                  <td className="border p-2">{o.customer_phone ?? '—'}</td>
                  <td className="border p-2">{o.phone_id}</td>
                  <td className="border p-2">{o.status}</td>
                  <td className="border p-2 text-right">${o.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Right panel */}
      <aside
        className="bg-white border-l"
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: ASIDE_WIDTH, zIndex: 20, display: 'flex', flexDirection: 'column' }}
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
          ) : loadingDetails ? (
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
              <div>
                <button
                  onClick={() => navigate(`/order/${selectedId}`)}
                  className="px-3 py-2 rounded bg-blue-600 text-white border border-blue-700 hover:bg-blue-700"
                >
                  Edit this order
                </button>
              </div>
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
    </div>
  );
};

export default OrderList;
