import React, { useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
}

interface Dish {
  id: number;
  name: string;
  price: number;
  category_id: number;
}

const OrderScreen: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await window.db.getCategories();
        setCategories(result);
        if (result.length > 0) {
          setSelectedCategory(result[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory !== null) {
      const fetchDishes = async () => {
        try {
          setLoading(true);
          const result = await window.db.getDishes(selectedCategory);
          setDishes(result);
          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch dishes:', error);
          setLoading(false);
        }
      };
      fetchDishes();
    }
  }, [selectedCategory]);

  if (loading && categories.length === 0) {
    return <div className="p-4">Loading database...</div>;
  }

  if (categories.length === 0) {
    return <div className="p-4">No items available. The database might be empty.</div>;
  }

  return (
    <div className="flex h-screen">
      <nav className="w-1/4 bg-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <ul>
          {categories.map((category) => (
            <li
              key={category.id}
              className={`p-2 cursor-pointer rounded ${selectedCategory === category.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </li>
          ))}
        </ul>
      </nav>
      <main className="w-3/4 p-4">
        <h2 className="text-xl font-bold mb-4">Dishes</h2>
        {loading ? (
          <div>Loading dishes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.length > 0 ? (
              dishes.map((dish) => (
                <div key={dish.id} className="border p-4 rounded shadow">
                  <h3 className="font-bold">{dish.name}</h3>
                  <p>${dish.price.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p>No dishes in this category.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderScreen;
