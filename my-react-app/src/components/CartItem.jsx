import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <img
        src={item.image_url || "https://via.placeholder.com/80x80?text=No+Image"}
        alt={item.name}
        className="cart-item-img"
      />
      <div className="cart-item-details">
        <h4>{item.name}</h4>
        <p className="cart-item-price">₹{item.price.toFixed(2)}</p>
      </div>
      <div className="cart-item-qty">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="qty-btn"
        >
          -
        </button>
        <span className="qty-value">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="qty-btn"
        >
          +
        </button>
      </div>
      <div className="cart-item-subtotal">
        ₹{(item.price * item.quantity).toFixed(2)}
      </div>
      <button onClick={() => removeFromCart(item.id)} className="cart-item-remove">
        ✕
      </button>
    </div>
  );
}
