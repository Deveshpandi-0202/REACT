import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, Check, ChevronLeft, Package } from "lucide-react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const toast = useToast();
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/products/${id}`)
      .then((res) => {
        if (!cancelled) {
          setProduct(res.data);
          setQuantity(1);
        }
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="empty"><Package size={40} className="empty-icon" /><h2>Product not found</h2><Link to="/" className="btn btn-primary">Back to Home</Link></div>;

  const outOfStock = product.stock <= 0;

  return (
    <motion.div
      className="product-detail"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link to="/" className="back-link">
        <ChevronLeft size={16} /> Back to Products
      </Link>
      <div className="product-detail-body">
        <div className="product-detail-img">
          <motion.img
            src={product.image_url || "https://via.placeholder.com/500x400?text=No+Image"}
            alt={product.name}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="product-detail-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-detail-desc">{product.description}</p>
          <p className="product-detail-price">₹{product.price.toFixed(2)}</p>
          <p className={`product-detail-stock ${outOfStock ? "out" : ""}`}>
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
          </p>
          {!outOfStock && (
            <div className="product-detail-qty">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="qty-btn"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <motion.span key={quantity} className="qty-value" initial={{ scale: 1.2 }} animate={{ scale: 1 }}>
                {quantity}
              </motion.span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="qty-btn"
                disabled={quantity >= product.stock}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
          <button
            className="btn btn-primary btn-add"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            {added ? (
              <>
                <Check size={18} /> Added!
              </>
            ) : (
              <>
                <ShoppingCart size={18} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
