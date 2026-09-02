import { AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight } from "lucide-react";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_FEE = 30;

export default function Cart() {
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty">
          <ShoppingCart size={48} className="empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Browse our fresh products and add something to your cart.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const deliveryFee = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = totalPrice + deliveryFee;
  const itemsCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          <AnimatePresence>
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </div>

        <div className="cart-summary">
          <h3 className="summary-title">Order Summary</h3>
          <div className="summary-row">
            <span>Items ({itemsCount})</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery Fee</span>
            <span>
              {deliveryFee === 0 ? (
                <span className="free-delivery">FREE</span>
              ) : (
                `₹${deliveryFee.toFixed(2)}`
              )}
            </span>
          </div>
          {deliveryFee > 0 && (
            <p className="delivery-hint">
              Add ₹{(FREE_DELIVERY_THRESHOLD - totalPrice).toFixed(2)} more for free delivery
            </p>
          )}
          <div className="summary-total">
            <span>Grand Total</span>
            <span className="total-price">₹{grandTotal.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={() => (user ? navigate("/checkout") : navigate("/signin"))}
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>
          <Link to="/" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
