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
  // Local modals for input (avoid browser prompts)
  const [catModal, setCatModal] = useState<{ open: boolean; id?: number; name: string; error?: string }>({ open: false, name: '' });
  const [dishModal, setDishModal] = useState<{ open: boolean; id?: number; name: string; price: string; error?: string }>({ open: false, name: '', price: '' });

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

  const openAddCategory = () => setCatModal({ open: true, name: '' });
  const openRenameCategory = (cat: Category) => setCatModal({ open: true, id: cat.id, name: cat.name });
  const saveCategory = async () => {
    const name = (catModal.name ?? '').trim();
    if (!name) { setCatModal(m => ({ ...m, error: 'Name is required' })); return; }
    try {
      if (catModal.id) {
        await window.db.updateCategory(catModal.id, name);
      } else {
        await window.db.createCategory(name);
      }
      setCatModal({ open: false, name: '' });
    } catch (e) {
      console.error(e);
      setCatModal(m => ({ ...m, error: 'Failed to save category' }));
    }
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

  const openAddDish = () => {
    if (selectedCategory == null) { setDishModal({ open: false, name: '', price: '', error: 'Select a category first' }); return; }
    setDishModal({ open: true, name: '', price: '' });
  };
  const openEditDish = (dish: Dish) => setDishModal({ open: true, id: dish.id, name: dish.name, price: String(dish.price) });
  const saveDish = async () => {
    const name = (dishModal.name ?? '').trim();
    const priceNum = Number(dishModal.price);
    if (!name) { setDishModal(m => ({ ...m, error: 'Name is required' })); return; }
    if (Number.isNaN(priceNum) || priceNum < 0) { setDishModal(m => ({ ...m, error: 'Enter a valid price' })); return; }
    try {
      if (dishModal.id) {
        await window.db.updateDish(dishModal.id, { name, price: priceNum, category_id: selectedCategory ?? undefined });
      } else if (selectedCategory != null) {
        await window.db.createDish({ name, price: priceNum, category_id: selectedCategory });
      }
      setDishModal({ open: false, name: '', price: '' });
    } catch (e) {
      console.error(e);
      setDishModal(m => ({ ...m, error: 'Failed to save item' }));
    }
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
            <button onClick={openAddCategory} className="px-3 py-1 rounded bg-blue-600 text-white border border-blue-600 hover:bg-blue-700">+ Add</button>
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
                    <button onClick={() => openRenameCategory(cat)} className="px-2 py-1 text-sm rounded border">Rename</button>
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
            <button onClick={openAddDish} className="px-3 py-1 rounded bg-green-600 text-white border border-green-600 hover:bg-green-700">+ Add Item</button>
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
                    <button onClick={() => openEditDish(dish)} className="px-2 py-1 text-sm rounded border">Edit</button>
                    <button onClick={() => deleteDish(dish)} className="px-2 py-1 text-sm rounded border border-red-300 text-red-700">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {/* Category Modal */}
      {catModal.open && (
        <div role="dialog" aria-modal="true" onClick={() => setCatModal({ open: false, name: '' })} style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, width: '90%', maxWidth: 420, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb', padding: 16 }}>
            <h3 className="text-lg font-semibold mb-2">{catModal.id ? 'Rename Category' : 'New Category'}</h3>
            <label className="block mb-2 text-sm text-gray-700">Name</label>
            <input value={catModal.name} onChange={(e) => setCatModal(m => ({ ...m, name: e.target.value, error: undefined }))} className="w-full border rounded px-3 py-2" placeholder="e.g. Starters" />
            {catModal.error && <div className="text-red-600 text-sm mt-2">{catModal.error}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCatModal({ open: false, name: '' })} className="px-3 py-1 rounded border">Cancel</button>
              <button onClick={saveCategory} className="px-3 py-1 rounded bg-blue-600 text-white border border-blue-600">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Dish Modal */}
      {dishModal.open && (
        <div role="dialog" aria-modal="true" onClick={() => setDishModal({ open: false, name: '', price: '' })} style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, width: '90%', maxWidth: 420, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb', padding: 16 }}>
            <h3 className="text-lg font-semibold mb-2">{dishModal.id ? 'Edit Item' : 'New Item'}</h3>
            <div className="mb-3">
              <label className="block mb-2 text-sm text-gray-700">Name</label>
              <input value={dishModal.name} onChange={(e) => setDishModal(m => ({ ...m, name: e.target.value, error: undefined }))} className="w-full border rounded px-3 py-2" placeholder="e.g. Spring Rolls" />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-700">Price</label>
              <input value={dishModal.price} onChange={(e) => setDishModal(m => ({ ...m, price: e.target.value, error: undefined }))} className="w-full border rounded px-3 py-2" placeholder="e.g. 9.99" />
            </div>
            {dishModal.error && <div className="text-red-600 text-sm mt-2">{dishModal.error}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setDishModal({ open: false, name: '', price: '' })} className="px-3 py-1 rounded border">Cancel</button>
              <button onClick={saveDish} className="px-3 py-1 rounded bg-green-600 text-white border border-green-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
