import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_FEE = 30;

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);

  const deliveryFee = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = totalPrice + deliveryFee;
  const itemsCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0 && !done) {
    return (
      <div className="empty">
        <h2>Your cart is empty</h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Browse Products
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
      }));
      await api.post("/orders", { items: orderItems });
      clearCart();
      setDone(true);
      toast.success("Order placed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Order failed");
      setPlacing(false);
    }
  };

  if (done) {
    return (
      <motion.div
        className="empty order-success"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CheckCircle2 size={56} className="success-big" />
        <h2>Order Placed!</h2>
        <p>Your groceries are on their way. Track them in My Orders.</p>
        <Link to="/orders" className="btn btn-primary">
          View My Orders
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="checkout-page">
      <button className="back-link" onClick={() => navigate("/cart")}>
        <ChevronLeft size={16} /> Back to Cart
      </button>
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <div className="checkout-main">
          <div className="checkout-section">
            <h3><MapPin size={18} /> Delivery Information</h3>
            <form onSubmit={handleSubmit} className="checkout-form" id="checkout-form-main">
              <input
                placeholder="Delivery Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <div className="checkout-row">
                <input
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <input
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                  pattern="[0-9]{6}"
                  title="Enter a 6-digit pincode"
                />
              </div>
              <input
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                pattern="[0-9]{10}"
                title="Enter a 10-digit phone number"
              />
            </form>
          </div>

          <div className="checkout-section">
            <h3>Order Items</h3>
            <div className="checkout-items">
              {items.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <img
                    src={item.image_url || "https://via.placeholder.com/40x40"}
                    alt={item.name}
                  />
                  <div className="checkout-item-info">
                    <span className="checkout-item-name">{item.name}</span>
                    <span className="checkout-item-qty">Qty {item.quantity}</span>
                  </div>
                  <span className="checkout-item-price">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cart-summary checkout-summary">
          <h3 className="summary-title">Price Summary</h3>
          <div className="summary-row"><span>Items ({itemsCount})</span><span>₹{totalPrice.toFixed(2)}</span></div>
          <div className="summary-row"><span>Subtotal</span><span>₹{totalPrice.toFixed(2)}</span></div>
          <div className="summary-row">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? <span className="free-delivery">FREE</span> : `₹${deliveryFee.toFixed(2)}`}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span className="total-price">₹{grandTotal.toFixed(2)}</span>
          </div>
          <button
            type="submit"
            form="checkout-form-main"
            className="btn btn-primary btn-block"
            disabled={placing}
          >
            {placing ? (
              <>
                <Loader2 size={18} className="spin" /> Placing Order...
              </>
            ) : (
              `Confirm Order · ₹${grandTotal.toFixed(2)}`
            )}
          </button>
          <p className="security-note">
            {user ? `Delivering to ${user.name}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
