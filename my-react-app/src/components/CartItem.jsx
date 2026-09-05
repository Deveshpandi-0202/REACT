import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, PackageX, BadgePercent } from "lucide-react";
import { FALLBACK_IMG } from "./ProductCard";
import { useCart } from "../context/CartContext";
import { formatINR } from "../utils/pricing";

function discountOf(item) {
  return item.discount && item.discount > 0
    ? item.discount
    : item.original_price > item.price
      ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
      : 0;
}

export default function CartItem({ item, unavailable }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [imgSrc, setImgSrc] = useState(item.image_url || FALLBACK_IMG);
  const discount = discountOf(item);
  const atMin = item.quantity <= 1;
  const atMax = item.stock > 0 && item.quantity >= item.stock;

  return (
    <motion.div
      className={`cart-item ${unavailable ? "unavailable" : ""}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      <img
        src={imgSrc}
        alt={item.name}
        className="cart-item-img"
        loading="lazy"
        decoding="async"
        onError={() => setImgSrc(FALLBACK_IMG)}
      />
      <div className="cart-item-details">
        <div className="cart-item-title-row">
          <h4>{item.name}</h4>
          {discount > 0 && (
            <span className="cart-item-discount">
              <BadgePercent size={11} /> {discount}% OFF
            </span>
          )}
        </div>
        {item.category && <p className="cart-item-category">{item.category}</p>}
        <p className="cart-item-price">
          {formatINR(item.price)} each
          {discount > 0 && <span className="cart-item-original">{formatINR(item.original_price)}</span>}
        </p>
        {unavailable && (
          <p className="cart-item-unavailable">
            <PackageX size={13} /> Out of Stock — remove to continue
          </p>
        )}
      </div>

      {!unavailable && (
        <div className="cart-item-qty">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="qty-btn"
            disabled={atMin}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Minus size={14} />
          </button>
          <motion.span
            key={item.quantity}
            className="qty-value"
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            aria-live="polite"
          >
            {item.quantity}
          </motion.span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="qty-btn"
            disabled={atMax}
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      <AnimatePresence>
        <motion.div
          key={item.quantity}
          className="cart-item-subtotal"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {formatINR(item.price * item.quantity)}
        </motion.div>
      </AnimatePresence>

      <button
        onClick={() => removeFromCart(item.id)}
        className="cart-item-remove"
        aria-label={`Remove ${item.name} from cart`}
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}