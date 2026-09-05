import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Minus, Plus, ShoppingCart, Check, ChevronLeft,
  Star, Zap, PackageCheck, PackageX, RefreshCw,
} from "lucide-react";
import api from "../api/axios";
import { FALLBACK_IMG } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

const DEFAULT_DESC = "Fresh quality groceries, ready for your basket.";

function DetailSkeleton() {
  return (
    <div className="detail-skel">
      <div className="skeleton skeleton-img" />
      <div className="detail-skel-info">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line big" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [tried, setTried] = useState(0);
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
          setImgSrc(res.data?.image_url || FALLBACK_IMG);
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
  }, [id, tried]);

  const handleAddToCart = (goToCart = false) => {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 2000);
    if (goToCart) navigate("/cart");
  };

  if (loading) return <DetailSkeleton />;
  if (!product) {
    return (
      <div className="empty">
        <PackageX size={48} className="empty-icon" />
        <h2>Couldn't load this product.</h2>
        <p>It may have been removed or the connection was interrupted.</p>
        <div className="empty-actions">
          <button className="btn btn-primary" onClick={() => setTried((t) => t + 1)}>
            <RefreshCw size={16} /> Try Again
          </button>
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;
  const discount =
    product.discount && product.discount > 0
      ? product.discount
      : product.original_price > product.price
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : 0;
  const description = product.description && product.description.trim() ? product.description : DEFAULT_DESC;

  return (
    <motion.div
      className="product-detail"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link to="/" className="back-link">
        <ChevronLeft size={16} /> Back to Home
      </Link>
      <div className="product-detail-body">
        <div className="product-detail-img">
          <motion.img
            key={imgSrc}
            src={imgSrc}
            alt={product.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onError={() => { if (imgSrc !== FALLBACK_IMG) setImgSrc(FALLBACK_IMG); }}
          />
          {discount > 0 && <span className="pcard-discount">{discount}% OFF</span>}
          {outOfStock && <div className="detail-stock-overlay">Out of stock</div>}
        </div>
        <div className="product-detail-info">
          <div className="detail-meta">
            <span className="product-category">{product.category}</span>
            {product.rating > 0 && (
              <span className="pcard-rating">
                <Star size={13} fill="currentColor" aria-hidden="true" /> {Number(product.rating).toFixed(1)}
              </span>
            )}
          </div>
          <h1>{product.name}</h1>
          <p className="product-detail-desc">{description}</p>

          <div className="detail-price-block">
            <span className="detail-price">₹{Number(product.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            {discount > 0 && <span className="detail-original">₹{Number(product.original_price).toLocaleString("en-IN")}</span>}
            {discount > 0 && <span className="detail-save">Save {discount}%</span>}
          </div>

          <div className="detail-stock-row">
            {outOfStock ? (
              <p className="product-detail-stock out"><PackageX size={15} /> Out of stock</p>
            ) : lowStock ? (
              <p className="product-detail-stock low"><PackageCheck size={15} /> Only {product.stock} left</p>
            ) : (
              <p className="product-detail-stock"><PackageCheck size={15} /> In stock</p>
            )}
          </div>

          {!outOfStock && (
            <>
              <div className="detail-qty-row">
                <span className="detail-qty-label" id="detail-qty-label">Quantity</span>
                <div className="product-detail-qty" role="group" aria-labelledby="detail-qty-label">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="qty-btn"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <motion.span key={quantity} className="qty-value" initial={{ scale: 1.2 }} animate={{ scale: 1 }} aria-live="polite">
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
              </div>

              <div className="detail-actions">
                <button
                  className="btn btn-primary btn-add"
                  onClick={() => handleAddToCart(false)}
                >
                  {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                  {added ? "Added!" : "Add to Cart"}
                </button>
                <button
                  className="btn btn-buy"
                  onClick={() => handleAddToCart(true)}
                >
                  <Zap size={18} /> Buy Now
                </button>
              </div>
              <p className="detail-subtotal">
                Subtotal for {quantity} item{quantity > 1 ? "s" : ""}:{" "}
                <strong>₹{((product.price * quantity)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}