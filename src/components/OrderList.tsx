import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface OrderRow {
  id: number;
  created_at: string;
  status: string;
  phone_id: number;
  customer_name?: string;
  customer_phone?: string;
  total: number;
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows = await window.db.getOrdersToday();
        setOrders(rows);
      } catch (e: any) {
        console.error(e);
        const msg = (e && e.message) || '';
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
  }, []);

  return (
    <div className="p-4">
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
                <tr key={o.id}>
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
    </div>
  );
};

export default OrderList;
