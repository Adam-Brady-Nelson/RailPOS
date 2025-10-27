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
  const gridCols = 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';
  if (loading) return <div>Loading items…</div>;
  if (!dishes.length) return <div className="text-gray-600">No items in this category.</div>;
  return (
    <div className={`items-grid grid ${gridCols}`}>
      {dishes.map((dish) => (
        <button
          key={dish.id}
          className="h-16 rounded-lg shadow border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.99] text-left p-3"
          onClick={() => onAdd(dish)}
        >
          <div className="font-semibold leading-tight line-clamp-2">{dish.name}</div>
          <div className="text-sm text-gray-600 mt-1">${dish.price.toFixed(2)}</div>
        </button>
      ))}
    </div>
  );
};

export default ItemsGrid;
