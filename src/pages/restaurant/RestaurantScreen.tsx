import React, { useCallback, useEffect, useMemo, useState } from 'react';
import StyleSwitcher from '../../components/StyleSwitcher';
import BottomNav from '../../components/BottomNav';
import '../OrderScreen.css';
import './RestaurantScreen.css';

type Table = { id: string; name: string; x: number; y: number; w: number; h: number };

export default function RestaurantScreen() {
  const [layout, setLayout] = useState<Table[]>([]);
  const [occ, setOcc] = useState<Record<string, { occupied: boolean; orderId?: number }>>({});

  useEffect(() => {
    (async () => {
      try {
        const s = await window.settings.get();
        setLayout(s.restaurantLayout ?? []);
      } catch (err) { console.warn('[RestaurantScreen] settings.get failed', err); }
      try {
        const rows = await window.db.getRestaurantOccupancy();
        const map: Record<string, { occupied: boolean; orderId?: number }> = {};
        for (const r of rows) map[r.table.id] = { occupied: r.occupied, orderId: r.orderId };
        setOcc(map);
      } catch (err) { console.warn('[RestaurantScreen] getRestaurantOccupancy failed', err); }
    })();
  }, []);

  const onTableClick = useCallback(async (t: Table) => {
    const state = occ[t.id];
    if (!state?.occupied) {
      // open table: create pending order
      await window.db.openTable(t.id);
    } else {
      // close table: mark paid (no items in MVP); default no payment method
      await window.db.closeTable(t.id);
    }
    // refresh
    try {
      const rows = await window.db.getRestaurantOccupancy();
      const map: Record<string, { occupied: boolean; orderId?: number }> = {};
      for (const r of rows) map[r.table.id] = { occupied: r.occupied, orderId: r.orderId };
      setOcc(map);
    } catch (err) { console.warn('[RestaurantScreen] refresh occupancy failed', err); }
  }, [occ]);

  const tiles = useMemo(() => layout.map(t => {
    const state = occ[t.id] ?? { occupied: false };
    return (
      <div
        key={t.id}
        onClick={() => onTableClick(t)}
        className={`restaurant-table ${state.occupied ? 'restaurant-table--occupied' : 'restaurant-table--free'}`}
        style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
        title={state.occupied ? `Occupied (Order #${state.orderId ?? ''})` : 'Free'}
      >
        <div className="restaurant-table__content">
          <div style={{ fontWeight: 700 }}>{t.name}</div>
          <div className="restaurant-table__status">{state.occupied ? 'Occupied' : 'Free'}</div>
        </div>
      </div>
    );
  }), [layout, occ, onTableClick]);

  return (
    <div className="order-screen__container">
      <div className="order-screen__header restaurant-header">
        <h1 className="order-screen__title">Restaurant</h1>
        <div className="restaurant-header__right">
          <StyleSwitcher />
        </div>
      </div>

      <div className="restaurant-canvas">
        {tiles}
      </div>
      <div className="restaurant-hint">Click a free table to open it; click an occupied table to close it.</div>
      <BottomNav />
    </div>
  );
}
