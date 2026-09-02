import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <motion.div
      className="cart-item"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      <img
        src={item.image_url || "https://via.placeholder.com/80x80?text=No+Image"}
        alt={item.name}
        className="cart-item-img"
      />
      <div className="cart-item-details">
        <h4>{item.name}</h4>
        <p className="cart-item-price">₹{item.price.toFixed(2)} each</p>
      </div>
      <div className="cart-item-qty">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="qty-btn"
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <motion.span
          key={item.quantity}
          className="qty-value"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {item.quantity}
        </motion.span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="qty-btn"
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>
      <AnimatePresence>
        <motion.div key={item.quantity} className="cart-item-subtotal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          ₹{(item.price * item.quantity).toFixed(2)}
        </motion.div>
      </AnimatePresence>
      <button
        onClick={() => removeFromCart(item.id)}
        className="cart-item-remove"
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}
