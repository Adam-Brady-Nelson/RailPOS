import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfirm } from './ConfirmProvider';

type Category = { id: number; name: string };
type Dish = { id: number; name: string; price: number; category_id: number };

const MenuManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const confirm = useConfirm();

  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const result = await window.db.getCategories();
      setCategories(result);
      if (result?.length && selectedCategory == null) setSelectedCategory(result[0].id);
    } finally {
      setLoadingCats(false);
    }
  }, [selectedCategory]);

  const loadDishes = useCallback(async (catId: number) => {
    setLoadingDishes(true);
    try {
      const result = await window.db.getDishes(catId);
      setDishes(result);
    } finally {
      setLoadingDishes(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { if (selectedCategory != null) loadDishes(selectedCategory); }, [selectedCategory, loadDishes]);

  useEffect(() => {
    const off = window.db.onDataChanged(({ entity, category_id }) => {
      if (entity === 'category') loadCategories();
      if (entity === 'dish' && selectedCategory != null) loadDishes(category_id ?? selectedCategory);
    });
    return () => off();
  }, [selectedCategory, loadCategories, loadDishes]);

  const selectedCatName = useMemo(() => categories.find(c => c.id === selectedCategory)?.name ?? '—', [categories, selectedCategory]);

  const addCategory = async () => {
    const name = prompt('New category name:');
    if (!name) return;
    try { await window.db.createCategory(name.trim()); } catch (e) { console.error(e); alert('Failed to create category'); }
  };
  const renameCategory = async (cat: Category) => {
    const name = prompt('Rename category:', cat.name);
    if (!name) return;
    try { await window.db.updateCategory(cat.id, name.trim()); } catch (e) { console.error(e); alert('Failed to rename category'); }
  };
  const deleteCategory = async (cat: Category) => {
    const choice = await confirm({
      message: 'Delete category?',
      detail: `Delete “${cat.name}” and all its dishes? This cannot be undone.`,
      buttons: ['Cancel', 'Delete']
    });
    if (choice !== 1) return;
    try { await window.db.deleteCategory(cat.id); if (selectedCategory === cat.id) setSelectedCategory(null); } catch (e) { console.error(e); alert('Failed to delete category'); }
  };

  const addDish = async () => {
    if (selectedCategory == null) return alert('Select a category first');
    const name = prompt('Dish name:');
    if (!name) return;
    const priceStr = prompt('Price (e.g. 9.99):', '0');
    if (!priceStr) return;
    const price = Number(priceStr);
    if (Number.isNaN(price)) return alert('Invalid price');
    try { await window.db.createDish({ name: name.trim(), price, category_id: selectedCategory }); } catch (e) { console.error(e); alert('Failed to create dish'); }
  };
  const editDish = async (dish: Dish) => {
    const name = prompt('Dish name:', dish.name);
    if (!name) return;
    const priceStr = prompt('Price (e.g. 9.99):', String(dish.price));
    if (!priceStr) return;
    const price = Number(priceStr);
    if (Number.isNaN(price)) return alert('Invalid price');
    try { await window.db.updateDish(dish.id, { name: name.trim(), price, category_id: selectedCategory ?? dish.category_id }); } catch (e) { console.error(e); alert('Failed to update dish'); }
  };
  const deleteDish = async (dish: Dish) => {
    const choice = await confirm({ message: 'Delete item?', detail: `Delete “${dish.name}”?`, buttons: ['Cancel', 'Delete'] });
    if (choice !== 1) return;
    try { await window.db.deleteDish(dish.id); } catch (e) { console.error(e); alert('Failed to delete dish'); }
  };

  return (
    <div className="p-4">
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/setup"
          style={{
            padding: '8px 12px',
            background: '#111827',
            color: '#ffffff',
            borderRadius: 8,
            border: '1px solid #111827',
            cursor: 'pointer',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          ← Back to Setup
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Manage Menu</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Categories</h2>
            <button onClick={addCategory} className="px-3 py-1 rounded bg-blue-600 text-white border border-blue-600 hover:bg-blue-700">+ Add</button>
          </div>
          <ul className="space-y-2">
            {loadingCats ? (
              <li>Loading…</li>
            ) : categories.length === 0 ? (
              <li className="text-gray-600">No categories yet.</li>
            ) : (
              categories.map(cat => (
                <li key={cat.id} className={`flex items-center justify-between border rounded p-2 ${selectedCategory === cat.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
                  <button onClick={() => setSelectedCategory(cat.id)} className="text-left font-medium flex-1">
                    {cat.name}
                  </button>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => renameCategory(cat)} className="px-2 py-1 text-sm rounded border">Rename</button>
                    <button onClick={() => deleteCategory(cat)} className="px-2 py-1 text-sm rounded border border-red-300 text-red-700">Delete</button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Items in “{selectedCatName}”</h2>
            <button onClick={addDish} className="px-3 py-1 rounded bg-green-600 text-white border border-green-600 hover:bg-green-700">+ Add Item</button>
          </div>
          {selectedCategory == null ? (
            <div className="text-gray-600">Select a category to manage items.</div>
          ) : loadingDishes ? (
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
                    <button onClick={() => editDish(dish)} className="px-2 py-1 text-sm rounded border">Edit</button>
                    <button onClick={() => deleteDish(dish)} className="px-2 py-1 text-sm rounded border border-red-300 text-red-700">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default MenuManager;
