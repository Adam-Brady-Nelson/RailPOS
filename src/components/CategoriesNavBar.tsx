import React from 'react';

export type Category = { id: number; name: string };

interface Props {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelect: (id: number) => void;
  height?: number; // px
}

const CategoriesNavBar: React.FC<Props> = ({ categories, selectedCategoryId, onSelect, height = 96 }) => {
  return (
    <div style={{ height }} className="fixed bottom-0 left-0 right-0 bg-white border-t z-20">
      <div className="h-full overflow-x-auto">
        <div className="flex items-center gap-2 px-3 py-3 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                fontWeight: 600,
                border: '2px solid ' + (selectedCategoryId === cat.id ? '#2563eb' : '#d1d5db'),
                background: selectedCategoryId === cat.id ? '#2563eb' : '#ffffff',
                color: selectedCategoryId === cat.id ? '#ffffff' : '#111827',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesNavBar;
