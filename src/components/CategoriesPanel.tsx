import React from 'react';

export type Category = { id: number; name: string };

interface Props {
  categories: Category[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onRename: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

const CategoriesPanel: React.FC<Props> = ({ categories, loading, selectedId, onSelect, onAdd, onRename, onDelete }) => {
  return (
    <section className="md:col-span-1">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Categories</h2>
        <button onClick={onAdd} className="px-3 py-1 rounded bg-blue-600 text-white border border-blue-600 hover:bg-blue-700">+ Add</button>
      </div>
      <ul className="space-y-2">
        {loading ? (
          <li>Loading…</li>
        ) : categories.length === 0 ? (
          <li className="text-gray-600">No categories yet.</li>
        ) : (
          categories.map((cat) => (
            <li
              key={cat.id}
              className={`flex items-center justify-between border rounded p-2 ${selectedId === cat.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
            >
              <button onClick={() => onSelect(cat.id)} className="text-left font-medium flex-1">
                {cat.name}
              </button>
              <div className="flex items-center gap-2 ml-2">
                <button onClick={() => onRename(cat)} className="px-2 py-1 text-sm rounded border">Rename</button>
                <button onClick={() => onDelete(cat)} className="px-2 py-1 text-sm rounded border border-red-300 text-red-700">Delete</button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};

export default CategoriesPanel;
