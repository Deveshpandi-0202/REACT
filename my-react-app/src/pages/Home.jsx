import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Leaf, ShoppingBasket, Truck, ShieldCheck, Clock } from "lucide-react";
import api from "../api/axios";
import CategoryFilter from "../components/CategoryFilter";
import ProductCard from "../components/ProductCard";
import { useToast } from "../context/ToastContext";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function Skeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-img" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    api.get("/categories").then((res) => {
      if (!cancelled) setCategories(res.data || []);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      let cancelled = false;
      setLoading(true);
      setError("");
      const params = {};
      if (activeCategory) params.category = activeCategory;
      if (search) params.search = search;
      api
        .get("/products", { params })
        .then((res) => {
          if (!cancelled) {
            setProducts(res.data || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError("Failed to load products. Is the backend running?");
            setLoading(false);
          }
        });
    }, 300);
    return () => { clearTimeout(debounceRef.current); };
  }, [activeCategory, search]);

  const suggestions = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

  const hero = useRef(null);

  return (
    <div className="home-page">
      <motion.section
        className="hero"
        ref={hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="hero-content">
          <span className="hero-badge"><Leaf size={14} /> Fresh &amp; Fast Delivery</span>
          <h1 className="hero-title">
            Groceries delivered <span className="gradient-text">to your door</span>
          </h1>
          <p className="hero-sub">
            Shop fresh fruits, vegetables, dairy and more — delivered in minutes.
          </p>
          <form className="search-bar" onSubmit={(e) => e.preventDefault()}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search groceries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul
                  className="search-suggestions"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <Link to={`/product/${s.id}`} onClick={() => setSearch("")}>
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </form>
        </div>
        <div className="hero-art">
          <div className="hero-card hero-card-1"><ShoppingBasket size={26} /><span>10k+ Products</span></div>
          <div className="hero-card hero-card-2"><Truck size={26} /><span>Fast Delivery</span></div>
          <div className="hero-card hero-card-3"><ShieldCheck size={26} /><span>100% Fresh</span></div>
        </div>
      </motion.section>

      <motion.div
        className="feature-strip"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="feature-item"><Clock size={18} /><span>Delivery in minutes</span></div>
        <div className="feature-item"><Leaf size={18} /><span>Farm fresh produce</span></div>
        <div className="feature-item"><ShieldCheck size={18} /><span>Best prices guaranteed</span></div>
      </motion.div>

      <CategoryFilter
        categories={categories}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      {error && <div className="error-msg">{error}</div>}
      {loading ? (
        <Skeleton />
      ) : products.length === 0 ? (
        <div className="empty">
          <Leaf size={40} className="empty-icon" />
          <h2>No products found</h2>
          <p>Try a different search or category.</p>
          <button className="btn btn-primary" onClick={() => { setSearch(""); setActiveCategory(""); }}>
            View All Products
          </button>
        </div>
      ) : (
        <motion.div
          className="product-grid"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {products.map((p) => (
            <motion.div key={p.id} variants={item}>
              <ProductCard product={p} onAdd={(d) => toast.success(`Added ${d.name} to cart`)} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
