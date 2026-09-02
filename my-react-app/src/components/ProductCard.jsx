import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, onAdd }) {
  const { addToCart, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = items.find((i) => i.id === product.id);
  const outOfStock = product.stock <= 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addToCart(product, 1);
    if (onAdd) onAdd(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className={`product-card ${outOfStock ? "out" : ""}`}>
      <Link to={`/product/${product.id}`} className="product-img-link">
        <div className="product-img-wrap">
          <motion.img
            src={product.image_url || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={product.name}
            className="product-img"
            loading="lazy"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
          />
          {outOfStock && <span className="stock-badge out">Out of stock</span>}
          {!outOfStock && product.stock <= 10 && (
            <span className="stock-badge low">Only {product.stock} left</span>
          )}
        </div>
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link to={`/product/${product.id}`} className="product-name-link">
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <p className="product-desc">{product.description}</p>
        <div className="product-bottom">
          <span className="product-price">₹{product.price.toFixed(2)}</span>
          {inCart ? (
            <div className="mini-qty">
              <button
                className="mini-qty-btn"
                onClick={(e) => { e.preventDefault(); }}
                aria-label="Quantity change in cart"
              >
                <Check size={14} /> In Cart {inCart.quantity > 1 ? `×${inCart.quantity}` : ""}
              </button>
            </div>
          ) : justAdded ? (
            <motion.span
              className="btn btn-primary btn-sm added-feedback"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <Check size={16} /> Added!
            </motion.span>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAdd}
              disabled={outOfStock}
            >
              <ShoppingCart size={15} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
