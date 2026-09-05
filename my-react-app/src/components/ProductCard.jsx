import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Star, Check } from "lucide-react";
import { useCart } from "../context/CartContext";

export const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="#d1fae5"/><stop offset="1" stop-color="#a7f3d0"/>` +
      `</linearGradient></defs>` +
      `<rect width="400" height="300" fill="url(#g)" rx="20"/>` +
      `<circle cx="200" cy="140" r="58" fill="#10b981" opacity="0.92"/>` +
      `<text x="200" y="168" font-size="62" text-anchor="middle">🥑</text>` +
      `<text x="200" y="234" font-size="18" text-anchor="middle" fill="#047857" font-family="sans-serif" font-weight="bold" letter-spacing="3">GROZO</text>` +
      `<text x="200" y="256" font-size="12" text-anchor="middle" fill="#065f46" font-family="sans-serif">Fresh picks</text>` +
      `</svg>`
  );

function formatPrice(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-IN", { maximumFractionDigits: num % 1 === 0 ? 0 : 2 });
}

export default function ProductCard({ product, onAdd }) {
  const { addToCart, updateQuantity, items } = useCart();
  const navigate = useNavigate();
  const [justAdded, setJustAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.image_url || FALLBACK_IMG);
  const snackRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(snackRef.current);
  }, []);

  const inCart = items.find((i) => i.id === product.id);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;
  const discount =
    product.discount && product.discount > 0
      ? product.discount
      : product.original_price > product.price
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product, 1);
    if (onAdd) onAdd(product);
    setJustAdded(true);
    clearTimeout(snackRef.current);
    snackRef.current = setTimeout(() => setJustAdded(false), 1200);
  };

  const handleStepQty = (e, delta) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) return;
    const next = inCart.quantity + delta;
    if (next <= 0) updateQuantity(product.id, 0);
    else updateQuantity(product.id, Math.min(next, product.stock));
  };

  const goToProduct = (e) => {
    if (!e.defaultPrevented) navigate(`/product/${product.id}`);
  };

  return (
    <div
      className={`pcard ${outOfStock ? "out" : ""} ${lowStock ? "low" : ""}`}
      onClick={goToProduct}
      role="button"
      tabIndex={0}
      aria-label={`${product.name}, ₹${formatPrice(product.price)}${discount > 0 ? `, ${discount}% off` : ""}`}
      onKeyDown={(e) => e.key === "Enter" && goToProduct(e)}
    >
      <div className="pcard-img-wrap">
        <img
          src={imgSrc}
          alt={product.name}
          className="pcard-img"
          loading="lazy"
          decoding="async"
          onError={() => setImgSrc(FALLBACK_IMG)}
        />
        {discount > 0 && <span className="pcard-discount">{discount}% OFF</span>}
        {outOfStock ? (
          <span className="pcard-stock out">Out of stock</span>
        ) : lowStock ? (
          <span className="pcard-stock low">{product.stock} left</span>
        ) : null}
      </div>

      <div className="pcard-body">
        <div className="pcard-meta">
          <span className="pcard-category">{product.category}</span>
          {product.rating > 0 && (
            <span className="pcard-rating">
              <Star size={12} fill="currentColor" aria-hidden="true" />
              {Number(product.rating).toFixed(1)}
            </span>
          )}
        </div>
        <h3 className="pcard-name">{product.name}</h3>
        <p className="pcard-desc">{product.description}</p>

        <div className="pcard-bottom">
          <div className="pcard-price-block">
            <span className="pcard-price">₹{formatPrice(product.price)}</span>
            {discount > 0 && (
              <span className="pcard-original">₹{formatPrice(product.original_price)}</span>
            )}
          </div>

          {inCart ? (
            <div className="pcard-qty" onClick={(e) => e.stopPropagation()}>
              <button
                className="qty-btn"
                onClick={(e) => handleStepQty(e, -1)}
                aria-label={`Decrease quantity of ${product.name}`}
              >
                <Minus size={13} />
              </button>
              <motion.span
                key={inCart.quantity}
                className="qty-value"
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                aria-live="polite"
              >
                {inCart.quantity}
              </motion.span>
              <button
                className="qty-btn"
                onClick={(e) => handleStepQty(e, 1)}
                disabled={inCart.quantity >= product.stock}
                aria-label={`Increase quantity of ${product.name}`}
              >
                <Plus size={13} />
              </button>
            </div>
          ) : justAdded ? (
            <motion.span
              className="pcard-add added"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              aria-live="polite"
            >
              <Check size={15} aria-hidden="true" />
              <span className="add-label">Added</span>
            </motion.span>
          ) : (
            <motion.button
              className="pcard-add"
              onClick={handleAdd}
              disabled={outOfStock}
              aria-label={`Add ${product.name} to cart`}
              whileTap={{ scale: outOfStock ? 1 : 0.9 }}
            >
              <Plus size={15} aria-hidden="true" />
              {!outOfStock && <span className="add-label">Add</span>}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}