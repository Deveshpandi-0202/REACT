import { useEffect, useState } from "react";
import api from "../api/axios";
import CategoryFilter from "../components/CategoryFilter";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get("/categories").then((res) => {
      if (!cancelled) setCategories(res.data);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (search) params.search = search;
    api
      .get("/products", { params })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.data);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [activeCategory, search]);

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Groceries delivered to your door</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <CategoryFilter
        categories={categories}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="empty">No products found</div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
