import React from 'react';
import './ItemsGrid.css';

export type Dish = { id: number; name: string; price: number; category_id: number };

interface Props {
  dishes: Dish[];
  loading: boolean;
  onAdd: (dish: Dish) => void;
}

const ItemsGrid: React.FC<Props> = ({ dishes, loading, onAdd }) => {
  // Make columns narrower by increasing the number of columns at each breakpoint
  // Responsive grid columns will be handled in CSS
  if (loading) return <div>Loading items…</div>;
  if (!dishes.length) return <div className="items-grid__empty">No items in this category.</div>;
  return (
    <div className="items-grid">
      {dishes.map((dish) => (
        <button
          key={dish.id}
          className="items-grid__item"
          onClick={() => onAdd(dish)}
        >
          <div className="items-grid__name">{dish.name}</div>
          <div className="items-grid__price">${dish.price.toFixed(2)}</div>
        </button>
      ))}
    </div>
  );
};

export default ItemsGrid;
