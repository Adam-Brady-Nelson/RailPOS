import React from 'react';
import './CategoriesNavBar.css';

export type Category = { id: number; name: string };

interface Props {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelect: (id: number) => void;
  height?: number; // px
  bottomOffset?: number; // px distance from bottom (to sit above checkout)
}

const CategoriesNavBar: React.FC<Props> = ({ categories, selectedCategoryId, onSelect, height = 112, bottomOffset = 0 }) => {
  return (
    <div
      style={{ height, bottom: bottomOffset, position: 'fixed', left: 0, right: 0 }}
      className="categories-navbar"
    >
      <div className="categories-navbar__scroll">
        <div className="categories-navbar__inner">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="cat-btn"
              style={{
                border: '2px solid ' + (selectedCategoryId === cat.id ? '#2563eb' : '#d1d5db'),
                background: selectedCategoryId === cat.id ? '#2563eb' : '#ffffff',
                color: selectedCategoryId === cat.id ? '#ffffff' : '#111827',
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
