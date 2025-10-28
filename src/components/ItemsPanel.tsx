import React from 'react';
import './ItemsPanel.css';

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
  <section className="items-panel">
      <div className="items-panel__header">
        <h2 className="items-panel__title">Items in “{selectedCatName}”</h2>
        <button onClick={onAdd} className="items-panel__add-btn">+ Add Item</button>
      </div>
      {selectedCategoryId == null ? (
        <div className="items-panel__empty">Select a category to manage items.</div>
      ) : loading ? (
        <div>Loading…</div>
      ) : dishes.length === 0 ? (
        <div className="items-panel__empty">No items in this category.</div>
      ) : (
        <ul className="items-panel__list">
          {dishes.map(dish => (
            <li key={dish.id} className="items-panel__item">
              <div>
                <div className="items-panel__item-name">{dish.name}</div>
                <div className="items-panel__item-price">${dish.price.toFixed(2)}</div>
              </div>
              <div className="items-panel__item-actions">
                <button onClick={() => onEdit(dish)} className="items-panel__edit-btn">Edit</button>
                <button onClick={() => onDelete(dish)} className="items-panel__delete-btn">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ItemsPanel;
