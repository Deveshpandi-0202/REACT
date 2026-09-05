import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, MapPin, Bell, ShoppingCart, ChevronDown, TrendingUp,
  Flame, BadgePercent, Loader2, ChevronRight, Sparkles, ArrowDownWideNarrow,
  CloudOff, RefreshCw, SearchX,
} from "lucide-react";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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

function Section({ title, icon, highlight, children, seeAllTo }) {
  return (
    <section className="home-section">
      <div className="home-section-head">
        <h2 className={`home-section-title ${highlight ? "highlight" : ""}`}>
          {icon}
          {title}
        </h2>
        {seeAllTo && (
          <Link to={seeAllTo} className="home-seeall">
            See all <ChevronRight size={14} />
          </Link>
        )}
      </div>
      <motion.div className="product-scroll" variants={container} initial="hidden" animate="show">
        {children}
      </motion.div>
    </section>
  );
}

function productCardJSX(products, onAdd) {
  return products.map((p) => (
    <motion.div key={p.id} variants={item} className="scroll-item">
      <ProductCard product={p} onAdd={onAdd} />
    </motion.div>
  ));
}

function SkeletonRow({ count = 5 }) {
  return (
    <div className="product-scroll">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card pcard-skel" key={i}>
          <div className="skeleton skeleton-img" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortKey, setSortKey] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);
  const toast = useToast();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const activeCategory = searchParams.get("category") || "";
  const search = searchParams.get("q") || "";

  const updateSearch = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("q", value);
      else next.delete("q");
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    api.get("/categories").then((res) => {
      if (!cancelled) setCategories(res.data || []);
    }).catch(() => {});
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
          setAllProducts(res.data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't load products.");
          setLoading(false);
          toast.error("Couldn't load products.");
        }
      });
    return () => { cancelled = true; };
  }, [activeCategory, search, retryKey, toast]);

  const setCategory = (cat) => {
    if (cat) setSearchParams({ category: cat });
    else setSearchParams({});
  };

  const categoryList = categories.length
    ? categories
    : [...new Set(allProducts.map((p) => p.category))];

  const sortedProducts = sortProducts(allProducts, sortKey);
  const gridView = Boolean(search || activeCategory);
  const gridItems = gridView ? sortedProducts : [];

  // Derived sections use only real data from the products API.
  const deals = allProducts.filter((p) => p.discount > 0 || p.original_price > p.price);
  const freshPicks = allProducts.filter((p) => p.rating >= 4.5 && p.stock > 0);
  const popular = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const shown = new Set(
    [...deals, ...freshPicks, ...popular].map((p) => p.id)
  );
  const recommended = [...allProducts]
    .filter((p) => !shown.has(p.id))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) + (b.discount || 0))
    .slice(0, 10);

  const focusSearch = () => inputRef.current?.focus();

  return (
    <div className="home-page">
      <header className="home-topbar">
        <div className="home-loc">
          <div className="loc-icon"><MapPin size={16} /></div>
          <button className="loc-text" onClick={() => toast.info("Delivery location: Bengaluru")}>
            <span className="loc-label">Deliver to</span>
            <span className="loc-value">
              Bengaluru <ChevronDown size={13} />
            </span>
          </button>
        </div>
        <div className="home-top-actions">
          <button className="icon-btn" onClick={() => toast.info("No new notifications")} aria-label="Notifications">
            <Bell size={19} />
          </button>
          <button className="icon-btn cart" onClick={() => navigate("/cart")} aria-label="Cart">
            <ShoppingCart size={19} />
            {totalItems > 0 && <span className="icon-badge">{totalItems}</span>}
          </button>
          <button className="home-avatar" onClick={() => navigate("/profile")} aria-label="Profile">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>
        </div>
      </header>

      <div className="home-search" role="search" onClick={focusSearch}>
        <Search size={18} className="home-search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search fruits, vegetables, snacks…"
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          aria-label="Search products"
        />
        {search && (
          <button className="home-search-clear" onClick={() => { updateSearch(""); inputRef.current?.focus(); }} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {search && (
          <motion.div
            className="home-search-suggest"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <p>
              Results for <strong>“{search}”</strong> · {loading ? "…" : allProducts.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {gridView && (
        <div className="sort-bar">
          <ArrowDownWideNarrow size={15} className="sort-icon" />
          <label className="sort-label" htmlFor="home-sort">Sort</label>
          <select
            id="home-sort"
            className="sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {!search && !activeCategory && (
        <>
          <motion.div
            className="home-banner"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="banner-content">
              <span className="banner-badge">Up to 20% off</span>
              <h2>
                Fresh groceries,
                <br />
                <em>delivered fast</em>
              </h2>
              <p>Farm-fresh produce at your doorstep in minutes.</p>
              <div className="banner-cta-row">
                <button
                  className="banner-cta"
                  onClick={() => {
                    navigate("/categories");
                    toast.info("Fresh picks • Great prices • Fast delivery");
                  }}
                >
                  Shop Now <ChevronRight size={15} />
                </button>
                <span className="banner-note">Fresh picks · Great prices · Fast delivery</span>
              </div>
            </div>
            <div className="banner-art">
              <span className="ba ba-1">🥕</span>
              <span className="ba ba-2">🍎</span>
              <span className="ba ba-3">🥬</span>
              <span className="ba ba-4">🧺</span>
            </div>
          </motion.div>

          <motion.div
            className="home-categories"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="home-section-head">
              <h2 className="home-section-title"><Sparkles size={18} /> Shop by Category</h2>
              <Link to="/categories" className="home-seeall">
                See all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="category-chip-scroll">
              {categoryList.map((cat) => (
                <button
                  key={cat}
                  className={`category-chip ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {error && (
            <div className="error-state">
              <CloudOff size={34} className="error-state-icon" />
              <h3>Couldn't load products.</h3>
              <p>Check your connection and try again.</p>
              <button className="btn btn-primary" onClick={() => setRetryKey((k) => k + 1)}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}

          {loading && allProducts.length === 0 ? (
            <SkeletonRow count={5} />
          ) : deals.length > 0 ? (
            <Section title="Deals of the Day" icon={<BadgePercent size={18} />} highlight>
              {productCardJSX(deals.slice(0, 10), (d) => toast.success(`Added ${d.name}`))}
            </Section>
          ) : null}

          {!error && freshPicks.length > 0 && (
            <Section title="Fresh Picks" icon={<Sparkles size={18} />}>
              {productCardJSX(freshPicks.slice(0, 10), (d) => toast.success(`Added ${d.name}`))}
            </Section>
          )}

          {!error && popular.length > 0 && (
            <Section title="Popular Right Now" icon={<Flame size={18} />}>
              {productCardJSX(popular, (d) => toast.success(`Added ${d.name}`))}
            </Section>
          )}

          {!error && recommended.length > 0 && (
            <Section title="Recommended for You" icon={<TrendingUp size={18} />}>
              {productCardJSX(recommended, (d) => toast.success(`Added ${d.name}`))}
            </Section>
          )}
        </>
      )}

      {gridView && (
        <>
          {loading && allProducts.length === 0 ? (
            <div className="product-grid home-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton skeleton-img" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="error-state">
              <CloudOff size={34} className="error-state-icon" />
              <h3>Couldn't load products.</h3>
              <p>Check your connection and try again.</p>
              <button className="btn btn-primary" onClick={() => setRetryKey((k) => k + 1)}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          ) : gridItems.length === 0 ? (
            <div className="empty">
              <SearchX size={44} className="empty-icon" />
              <h2>No products found</h2>
              <p>Try another search or category.</p>
              <div className="empty-actions">
                {activeCategory && (
                  <button className="btn btn-primary" onClick={() => setCategory("")}>
                    View all products
                  </button>
                )}
                <button
                  className={`btn ${activeCategory ? "btn-outline" : "btn-primary"}`}
                  onClick={() => {
                    updateSearch("");
                    setCategory("");
                    inputRef.current?.focus();
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <motion.div className="product-grid home-grid" variants={container} initial="hidden" animate="show">
              {gridItems.map((p) => (
                <motion.div key={p.id} variants={item}>
                  <ProductCard product={p} onAdd={(d) => toast.success(`Added ${d.name}`)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {loading && <div className="loading-inline"><Loader2 size={18} className="spin" /></div>}
    </div>
  );
}