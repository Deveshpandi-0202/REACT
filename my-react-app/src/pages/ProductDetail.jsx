import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="empty">Product not found</div>;

  return (
    <div className="product-detail">
      <div className="product-detail-img">
        <img
          src={product.image_url || "https://via.placeholder.com/500x400?text=No+Image"}
          alt={product.name}
        />
      </div>
      <div className="product-detail-info">
        <span className="product-category">{product.category}</span>
        <h1>{product.name}</h1>
        <p className="product-detail-desc">{product.description}</p>
        <p className="product-detail-price">₹{product.price.toFixed(2)}</p>
        <p className="product-detail-stock">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>
        <div className="product-detail-qty">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="qty-btn"
          >
            -
          </button>
          <span className="qty-value">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            className="qty-btn"
            disabled={quantity >= product.stock}
          >
            +
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {added ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
