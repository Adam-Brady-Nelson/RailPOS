import React from 'react';
import './CategoriesPanel.css';

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
  <section className="categories-panel">
      <div className="categories-panel__header">
        <h2 className="categories-panel__title">Categories</h2>
        <button onClick={onAdd} className="categories-panel__add-btn">+ Add</button>
      </div>
  <ul className="categories-panel__list">
        {loading ? (
          <li>Loading…</li>
        ) : categories.length === 0 ? (
          <li className="categories-panel__empty">No categories yet.</li>
        ) : (
          categories.map((cat) => (
            <li
              key={cat.id}
              className={`categories-panel__item${selectedId === cat.id ? ' categories-panel__item--selected' : ''}`}
            >
              <button onClick={() => onSelect(cat.id)} className="categories-panel__item-btn">
                {cat.name}
              </button>
              <div className="categories-panel__item-actions">
                <button onClick={() => onRename(cat)} className="categories-panel__rename-btn">Rename</button>
                <button onClick={() => onDelete(cat)} className="categories-panel__delete-btn">Delete</button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};

export default CategoriesPanel;
