import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '../../components/ConfirmProvider';
import BackButton from '../../components/BackButton';

const CANVAS_W = 1000;
const CANVAS_H = 600;

type Table = { id: string; name: string; x: number; y: number; w: number; h: number };

function makeId() { return Math.random().toString(36).slice(2, 8); }

export default function RestaurantLayoutEditor() {
  const [layout, setLayout] = useState<Table[]>([]);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    (async () => {
      try {
        const s = await window.settings.get();
        setLayout(s.restaurantLayout ?? []);
      } catch (err) {
        console.warn('[RestaurantLayoutEditor] Failed to load settings', err);
      }
    })();
  }, []);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    const el = e.currentTarget as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    setDrag({ id, dx: e.clientX - rect.left, dy: e.clientY - rect.top });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag) return;
    setLayout(prev => prev.map(t => t.id === drag.id ? { ...t, x: Math.max(0, Math.min(CANVAS_W - t.w, e.clientX - drag.dx - (canvasRef.current?.getBoundingClientRect().left ?? 0))), y: Math.max(0, Math.min(CANVAS_H - t.h, e.clientY - drag.dy - (canvasRef.current?.getBoundingClientRect().top ?? 0))) } : t));
  };

  const onMouseUp = () => setDrag(null);

  const addTable = () => {
    const n = layout.length + 1;
    setLayout(prev => [...prev, { id: makeId(), name: `T${n}`, x: 20 + n * 10, y: 20 + n * 10, w: 100, h: 80 }]);
  };

  const removeTable = (id: string) => setLayout(prev => prev.filter(t => t.id !== id));

  const save = async () => {
    await window.settings.set({ restaurantLayout: layout });
    // Show a lightweight in-app modal instead of a native/electron alert
    await confirm({ message: 'Layout saved', detail: 'Your restaurant layout has been saved successfully.', buttons: ['OK'] });
  };

  const tiles = useMemo(() => layout.map(t => (
    <div key={t.id}
      onMouseDown={(e) => onMouseDown(e, t.id)}
      style={{ position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, background: '#e0e7ff', border: '2px solid #3730a3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'move', userSelect: 'none' }}
      title={t.name}
    >
      <div style={{ textAlign: 'center', padding: 4 }}>
        <div style={{ fontWeight: 700 }}>{t.name}</div>
        <button style={{ marginTop: 6, fontSize: 12 }} onClick={(e) => { e.stopPropagation(); removeTable(t.id); }}>Remove</button>
      </div>
    </div>
  )), [layout]);

  return (
    <div style={{ padding: 12 }} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <div style={{ marginBottom: 8 }}>
        <BackButton to="/setup">← Back</BackButton>
      </div>
      <h1 style={{ margin: '8px 0 12px' }}>Restaurant Layout</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={addTable}>Add Table</button>
        <button onClick={save}>Save</button>
      </div>
      <div ref={canvasRef} style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, border: '1px dashed #94a3b8', background: '#f8fafc' }}>
        {tiles}
      </div>
      <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>Tip: Click and drag to reposition tables. Use Save to persist to settings.</div>
    </div>
  );
}
