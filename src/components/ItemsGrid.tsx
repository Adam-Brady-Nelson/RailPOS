import React from 'react';

export type Dish = { id: number; name: string; price: number; category_id: number };

interface Props {
  dishes: Dish[];
  loading: boolean;
  onAdd: (dish: Dish) => void;
}

const ItemsGrid: React.FC<Props> = ({ dishes, loading, onAdd }) => {
  const gridCols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
  if (loading) return <div>Loading items…</div>;
  if (!dishes.length) return <div className="text-gray-600">No items in this category.</div>;
  return (
    <div className={`grid ${gridCols} gap-3`}>
      {dishes.map((dish) => (
        <button
          key={dish.id}
          className="h-24 rounded-lg shadow border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.99] text-left p-3"
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
