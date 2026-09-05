import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight, Tag, Truck, AlertTriangle } from "lucide-react";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { computeSummary, formatINR } from "../utils/pricing";

export default function Cart() {
  const { items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { itemsCount, subtotal, savings, deliveryFee, total } = computeSummary(items);

  const unavailable = items.filter((i) => Number(i.stock) <= 0);
  const overStock = items.filter((i) => Number(i.stock) > 0 && i.quantity > Number(i.stock));
  const canCheckout = unavailable.length === 0 && overStock.length === 0;

  const goCheckout = () => navigate(user ? "/checkout" : "/signin");

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty">
          <ShoppingCart size={48} className="empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Add fresh groceries to get started.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-heading">
        <h1>Your Cart</h1>
        <p>{itemsCount} item{itemsCount > 1 ? "s" : ""}</p>
      </div>

      {deliveryFee > 0 && (
        <div className="free-delivery-bar">
          <Truck size={16} />
          Add {formatINR(500 - subtotal)} more to unlock <strong>FREE delivery</strong>
        </div>
      )}

      {!canCheckout && (
        <div className="cart-block-banner">
          <AlertTriangle size={16} />
          Some items are unavailable or above available stock. Fix them to continue to checkout.
        </div>
      )}

      <div className="cart-layout">
        <div className="cart-items">
          <AnimatePresence>
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                unavailable={Number(item.stock) <= 0}
              />
            ))}
          </AnimatePresence>
          {overStock.length > 0 && (
            <p className="delivery-hint">
              {overStock.map((i) => i.name).join(", ")}: only {overStock.map((i) => i.stock).join(", ")} in stock — the + button is capped.
            </p>
          )}
        </div>

        <div className="cart-summary">
          <h3 className="summary-title">Order Summary</h3>
          <motion.div key={subtotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} aria-live="polite">
            <div className="summary-row"><span>Items ({itemsCount})</span><span>{formatINR(subtotal)}</span></div>
            {savings > 0 && (
              <div className="summary-row savings">
                <span><Tag size={14} /> You save</span>
                <span className="savings-amount">−{formatINR(savings)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? <span className="free-delivery">FREE</span> : formatINR(deliveryFee)}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span className="total-price">{formatINR(total)}</span>
            </div>
          </motion.div>
          <button
            className="btn btn-primary btn-block"
            onClick={goCheckout}
            disabled={!canCheckout}
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>
          <Link to="/" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="cart-sticky-cta" aria-live="polite">
        <div className="cart-sticky-meta">
          <span>{itemsCount} item{itemsCount > 1 ? "s" : ""}</span>
          <strong>{formatINR(total)}</strong>
        </div>
        <button className="btn btn-primary" onClick={goCheckout} disabled={!canCheckout}>
          Checkout <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}