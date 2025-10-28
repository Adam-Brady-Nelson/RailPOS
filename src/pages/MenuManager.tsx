import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './MenuManager.css';
import { useConfirm } from '../components/ConfirmProvider';
import BackButton from '../components/BackButton';
import CategoriesPanel, { Category } from '../components/CategoriesPanel';
import ItemsPanel, { Dish } from '../components/ItemsPanel';

// Dish type now imported from ItemsPanel

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
  <div className="menu-manager-container">
      <div className="menu-manager-back">
        <BackButton to="/setup">← Back to Setup</BackButton>
      </div>
      <h1 className="menu-manager-title">Manage Menu</h1>
      <div className="menu-manager-grid">
        <CategoriesPanel
          categories={categories}
          loading={loadingCats}
          selectedId={selectedCategory}
          onSelect={(id) => setSelectedCategory(id)}
          onAdd={openAddCategory}
          onRename={openRenameCategory}
          onDelete={deleteCategory}
        />
        <ItemsPanel
          selectedCategoryId={selectedCategory}
          selectedCatName={selectedCatName}
          loading={loadingDishes}
          dishes={dishes}
          onAdd={openAddDish}
          onEdit={openEditDish}
          onDelete={deleteDish}
        />
      </div>
      {/* Category Modal */}
      {catModal.open && (
        <div role="dialog" aria-modal="true" onClick={() => setCatModal({ open: false, name: '' })} style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, width: '90%', maxWidth: 420, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb', padding: 16 }}>
            <h3 className="modal-title">{catModal.id ? 'Rename Category' : 'New Category'}</h3>
            <label className="modal-label">Name</label>
            <input value={catModal.name} onChange={(e) => setCatModal(m => ({ ...m, name: e.target.value, error: undefined }))} className="modal-input" placeholder="e.g. Starters" />
            {catModal.error && <div className="modal-error">{catModal.error}</div>}
            <div className="modal-actions">
              <button onClick={() => setCatModal({ open: false, name: '' })} className="modal-btn-cancel">Cancel</button>
              <button onClick={saveCategory} className="modal-btn-save">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Dish Modal */}
      {dishModal.open && (
        <div role="dialog" aria-modal="true" onClick={() => setDishModal({ open: false, name: '', price: '' })} style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, width: '90%', maxWidth: 420, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb', padding: 16 }}>
            <h3 className="modal-title">{dishModal.id ? 'Edit Item' : 'New Item'}</h3>
            <div className="modal-field">
              <label className="modal-label">Name</label>
              <input value={dishModal.name} onChange={(e) => setDishModal(m => ({ ...m, name: e.target.value, error: undefined }))} className="modal-input" placeholder="e.g. Spring Rolls" />
            </div>
            <div className="modal-field">
              <label className="modal-label">Price</label>
              <input value={dishModal.price} onChange={(e) => setDishModal(m => ({ ...m, price: e.target.value, error: undefined }))} className="modal-input" placeholder="e.g. 9.99" />
            </div>
            {dishModal.error && <div className="modal-error">{dishModal.error}</div>}
            <div className="modal-actions">
              <button onClick={() => setDishModal({ open: false, name: '', price: '' })} className="modal-btn-cancel">Cancel</button>
              <button onClick={saveDish} className="modal-btn-save">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
