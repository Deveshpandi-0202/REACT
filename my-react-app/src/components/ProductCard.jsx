import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <img
          src={product.image_url || "https://via.placeholder.com/300x200?text=No+Image"}
          alt={product.name}
          className="product-img"
        />
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-bottom">
          <span className="product-price">₹{product.price.toFixed(2)}</span>
          <Link to={`/product/${product.id}`} className="btn btn-primary btn-sm">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
