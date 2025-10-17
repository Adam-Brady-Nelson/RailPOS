import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const DailyTotals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; orders: number } | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await window.db.getDailyTotals();
        if (!ignore) setData(res);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('NO_ACTIVE_SHIFT')) {
          setError('No active shift. Start a shift from the home screen.');
        } else {
          setError(msg || 'Failed to load totals');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    const off = window.db.onDataChanged(({ entity }) => {
      if (entity === 'order') load();
    });
    return () => { ignore = true; off(); };
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

      <h1 className="text-2xl font-bold mb-6">Daily totals</h1>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : !data ? (
        <div>No data.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white border rounded p-4 shadow-sm">
            <div className="text-sm text-gray-600">Orders today</div>
            <div className="text-3xl font-bold">{data.orders}</div>
          </div>
          <div className="bg-white border rounded p-4 shadow-sm">
            <div className="text-sm text-gray-600">Total revenue</div>
            <div className="text-3xl font-bold">${data.total.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTotals;
