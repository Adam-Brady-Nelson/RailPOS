import React from 'react';

export type Dish = { id: number; name: string; price: number; category_id: number };

interface Props {
  selectedCategoryId: number | null;
  selectedCatName: string;
  loading: boolean;
  dishes: Dish[];
  onAdd: () => void;
  onEdit: (dish: Dish) => void;
  onDelete: (dish: Dish) => void;
}

const ItemsPanel: React.FC<Props> = ({ selectedCategoryId, selectedCatName, loading, dishes, onAdd, onEdit, onDelete }) => {
  return (
    <section className="md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Items in “{selectedCatName}”</h2>
        <button onClick={onAdd} className="px-3 py-1 rounded bg-green-600 text-white border border-green-600 hover:bg-green-700">+ Add Item</button>
      </div>
      {selectedCategoryId == null ? (
        <div className="text-gray-600">Select a category to manage items.</div>
      ) : loading ? (
        <div>Loading…</div>
      ) : dishes.length === 0 ? (
        <div className="text-gray-600">No items in this category.</div>
      ) : (
        <ul className="space-y-2">
          {dishes.map(dish => (
            <li key={dish.id} className="flex items-center justify-between border rounded p-2 bg-white">
              <div>
                <div className="font-medium">{dish.name}</div>
                <div className="text-sm text-gray-600">${dish.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit(dish)} className="px-2 py-1 text-sm rounded border">Edit</button>
                <button onClick={() => onDelete(dish)} className="px-2 py-1 text-sm rounded border border-red-300 text-red-700">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ItemsPanel;
