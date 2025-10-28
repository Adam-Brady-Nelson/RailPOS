import React, { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import './DailyTotals.css';

const DailyTotals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; orders: number } | null>(null);
  const [breakdown, setBreakdown] = useState<{ cash: number; card: number; total: number } | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const [res, b] = await Promise.all([
          window.db.getDailyTotals(),
          window.db.getRevenueBreakdownToday().catch(() => ({ cash: 0, card: 0, total: 0 }))
        ]);
        if (!ignore) { setData(res); setBreakdown(b); }
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
    <div className="daily-totals__container">
      <div style={{ marginBottom: 12 }}>
        <BackButton to="/">← Back</BackButton>
      </div>

      <h1 className="daily-totals__title">Daily totals</h1>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="daily-totals__error">{error}</div>
      ) : !data ? (
        <div>No data.</div>
      ) : (
        <div className="daily-totals__grid">
          <div className="daily-totals__card">
            <div className="daily-totals__label">Orders today</div>
            <div className="daily-totals__value">{data.orders}</div>
          </div>
          <div className="daily-totals__card">
            <div className="daily-totals__label">Total revenue</div>
            <div className="daily-totals__value">${data.total.toFixed(2)}</div>
          </div>
          <div className="daily-totals__card">
            <div className="daily-totals__label">Cash</div>
            <div className="daily-totals__value">${(breakdown?.cash ?? 0).toFixed(2)}</div>
          </div>
          <div className="daily-totals__card">
            <div className="daily-totals__label">Card</div>
            <div className="daily-totals__value">${(breakdown?.card ?? 0).toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTotals;
