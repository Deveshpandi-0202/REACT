import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid, ChevronRight, Loader2, Search, X, ArrowDownWideNarrow, Sparkles,
  CloudOff, RefreshCw, SearchX,
} from "lucide-react";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { useToast } from "../context/ToastContext";

const CATEGORY_META = {
  Fruits: { emoji: "🍎", color: "#ef4444" },
  Vegetables: { emoji: "🥦", color: "#22c55e" },
  Dairy: { emoji: "🥛", color: "#3b82f6" },
  Snacks: { emoji: "🍿", color: "#f59e0b" },
  Beverages: { emoji: "🧃", color: "#8b5cf6" },
  Household: { emoji: "🧴", color: "#06b6d4" },
  Bakery: { emoji: "🥖", color: "#a35d2e" },
  Staples: { emoji: "🌾", color: "#84cc16" },
  "Personal Care": { emoji: "🧴", color: "#db2777" },
};

const SORTS = [
  { key: "recommended", label: "Recommended" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
  { key: "discount", label: "Biggest Discount" },
];

function sortProducts(list, sortKey) {
  const arr = [...list];
  switch (sortKey) {
    case "price_asc":
      return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price_desc":
      return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "rating":
      return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "discount":
      return arr.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    default:
      return arr;
  }
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState(false);
  const [prodError, setProdError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get("/categories"), api.get("/products")])
      .then(([cRes, pRes]) => {
        if (!cancelled) {
          setCategories(cRes.data || []);
          setAllProducts(pRes.data || []);
        }
      })
      .catch(() => { if (!cancelled) setCatError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryKey]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    api.get("/products", { params: { category: selected } })
      .then((res) => { if (!cancelled) { setProducts(res.data || []); setProdError(""); } })
      .catch(() => { if (!cancelled) setProdError("Couldn't load products."); })
      .finally(() => { if (!cancelled) setCatLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

  const selectCategory = (cat) => {
    const next = selected === cat ? "" : cat;
    setCatLoading(true);
    setProdError("");
    setSelected(next);
  };

  const countFor = (cat) => allProducts.filter((p) => p.category === cat).length;

  const visibleCats = categories.filter((c) =>
    c.toLowerCase().includes(search.trim().toLowerCase())
  );

  const sortedProducts = sortProducts(products, sortKey);

  return (
    <div className="categories-page">
      <div className="page-heading">
        <h1><LayoutGrid size={22} /> Categories</h1>
        <p>Pick a category, then browse fresh products</p>
      </div>

      <div className="categories-search">
        <Search size={17} className="categories-search-icon" />
        <input
          type="text"
          placeholder="Filter categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filter categories"
        />
        {search && (
          <button className="home-search-clear" onClick={() => setSearch("")} aria-label="Clear category filter">
            <X size={15} />
          </button>
        )}
      </div>

      {catError ? (
        <div className="error-state">
          <CloudOff size={34} className="error-state-icon" />
          <h3>Couldn't load categories.</h3>
          <p>Check your connection and try again.</p>
          <button className="btn btn-primary" onClick={() => setRetryKey((k) => k + 1)}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      ) : loading ? (
        <div className="loading">
          <Loader2 size={24} className="spin" /> Loading categories…
        </div>
      ) : visibleCats.length === 0 ? (
        <div className="empty">
          <h2>No categories found</h2>
          <p>Try another keyword or clear the filter.</p>
          <button className="btn btn-outline" onClick={() => setSearch("")}>
            Clear filter
          </button>
        </div>
      ) : (
        <div className="categories-grid">
          {visibleCats.map((cat, i) => {
            const meta = CATEGORY_META[cat] || { emoji: "🛒", color: "#10b981" };
            const active = selected === cat;
            return (
              <motion.button
                key={cat}
                type="button"
                className={`category-card ${active ? "active" : ""}`}
                onClick={() => selectCategory(cat)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <span className="category-card-emoji" style={{ background: `${meta.color}1c` }}>
                  {meta.emoji}
                </span>
                <span className="category-card-body">
                  <h3>{cat}</h3>
                  <p>{countFor(cat)} products</p>
                </span>
                {active ? (
                  <span className="category-card-arrow active">✓</span>
                ) : (
                  <ChevronRight size={16} className="category-card-arrow" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {selected && (
        <section className="home-section category-products">
          <div className="home-section-head">
            <h2 className="home-section-title highlight">
              <Sparkles size={18} /> {selected}
            </h2>
            <div className="category-products-actions">
              <button
                type="button"
                className="category-clear-chip"
                onClick={() => selectCategory(selected)}
              >
                <X size={13} /> Clear
              </button>
              <div className="sort-bar inline">
                <ArrowDownWideNarrow size={14} className="sort-icon" />
                <select
                  className="sort-select"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  aria-label={`Sort ${selected} products`}
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {catLoading ? (
            <div className="product-grid home-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton skeleton-img" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                </div>
              ))}
            </div>
          ) : prodError ? (
            <div className="error-state">
              <CloudOff size={34} className="error-state-icon" />
              <h3>Couldn't load products.</h3>
              <p>Check your connection and try again.</p>
              <button className="btn btn-primary" onClick={() => selectCategory(selected)}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="empty">
              <SearchX size={44} className="empty-icon" />
              <h2>No products found</h2>
              <p>Try another search or category.</p>
              <div className="empty-actions">
                <button className="btn btn-primary" onClick={() => { selectCategory(selected); setSearch(""); }}>
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              className="product-grid home-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={(d) => toast.success(`Added ${d.name}`)} />
              ))}
            </motion.div>
          )}
        </section>
      )}

      <p className="categories-foot">
        <Link to="/">← Shop all on home</Link>
      </p>
    </div>
  );
}