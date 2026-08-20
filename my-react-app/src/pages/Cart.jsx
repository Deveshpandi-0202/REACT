import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import CartItem from "../components/CartItem";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState(false);
  const [message, setMessage] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/signin");
      return;
    }
    setOrdering(true);
    setMessage("");
    try {
      const orderItems = items.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
      }));
      await api.post("/orders", { items: orderItems });
      clearCart();
      setMessage("Order placed successfully!");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Order failed");
    } finally {
      setOrdering(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty">
          <h2>Your cart is empty</h2>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      {message && (
        <div className={message.includes("success") ? "success-msg" : "error-msg"}>
          {message}
        </div>
      )}
      <div className="cart-items">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
      <div className="cart-summary">
        <div className="cart-total">
          <span>Total:</span>
          <span className="total-price">₹{totalPrice.toFixed(2)}</span>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={handleCheckout}
          disabled={ordering}
        >
          {ordering ? "Placing Order..." : "Checkout"}
        </button>
      </div>
    </div>
  );
}
