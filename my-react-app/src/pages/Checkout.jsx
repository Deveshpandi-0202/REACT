import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Loader2, CheckCircle2, ChevronLeft, Banknote, QrCode,
  Tag, LocateFixed, PackageCheck, ShoppingCart,
} from "lucide-react";
import api from "../api/axios";
import { FALLBACK_IMG } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { computeSummary, formatINR } from "../utils/pricing";

const PAYMENT_META = {
  cod: { icon: Banknote, title: "Cash on Delivery", desc: "Pay when your order arrives" },
  gpay: { icon: QrCode, title: "GPay (QR)", desc: "Scan & pay at delivery" },
};

function validate(values) {
  const errors = {};
  if (!values.address.trim()) errors.address = "Delivery address is required.";
  else if (values.address.trim().length < 6) errors.address = "Please enter a complete delivery address.";
  if (!values.city.trim()) errors.city = "City is required.";
  if (!/^\d{6}$/.test(values.pincode)) errors.pincode = "Please enter a valid 6-digit pincode.";
  if (!/^\d{10}$/.test(values.phone)) errors.phone = "Please enter a valid phone number.";
  if (!values.streetArea.trim()) errors.streetArea = "Street / Area is required.";
  return errors;
}

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [payment, setPayment] = useState("cod");
  const [coords, setCoords] = useState(null);
  const [placing, setPlacing] = useState(false);
  const placingRef = useRef(false);
  const [done, setDone] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [placedTotal, setPlacedTotal] = useState(0);
  const [errors, setErrors] = useState({});
  const [isLocating, setIsLocating] = useState(false);

  const { itemsCount, subtotal, savings, deliveryFee, total } = computeSummary(items);

  if (items.length === 0 && !done) {
    return (
      <div className="empty">
        <ShoppingCart size={40} className="empty-icon" />
        <h2>Your cart is empty</h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Start Shopping
        </button>
      </div>
    );
  }

  const captureLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    let detAddress = "", detStreet = "", detCity = "", detPincode = "";
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser");
      setIsLocating(false);
      return;
    }
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(p),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ latitude, longitude });
      // Reverse geocoding only runs if geolocation SUCCEEDED
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`;
      const res = await fetch(nominatimUrl, { headers: { 'User-Agent': 'GROZO/1.0' } });
      if (!res.ok) throw new Error("Geocoding request failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const displayName = data.display_name || "";
      const addr = data.address || {};
      const parts = displayName.split(",");
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        if (!p) continue;
        if (!detCity && /^[A-Za-z\s]+$/.test(p) && !/^\d/.test(p) && p.length > 1) {
          detCity = p;
        }
        if (!detStreet && detStreet === "") {
          if (/^[\w\s\d\-/]+$/.test(p) || p.includes("Street") || p.includes("Road") || p.includes("Avenue") || p.includes("Boulevard")) {
            detStreet = p;
          }
        }
        if (!detPincode && /^\d{5,10}$/.test(p)) {
          detPincode = p;
        }
        if (!detAddress && !detStreet && p.length > 3) {
          detAddress = p;
        }
      }
      if (!detCity) {
        const cityVal = addr.city || addr.town || addr.village || addr.metro || "";
        if (cityVal && !/^\d/.test(cityVal) && cityVal.length > 1) detCity = cityVal;
      }
      if (!detPincode) {
        const pincodeVal = addr.postcode || addr.code || "";
        if (pincodeVal) detPincode = pincodeVal;
      }
      if (!detAddress && detStreet) detAddress = detStreet;
      if (!detAddress) detAddress = displayName;
      setAddress(detAddress);
      setStreetArea(detStreet || "");
      setCity(detCity || "");
      setPincode(detPincode || "");
      toast.success("Location added");
    } catch (err) {
      console.error("Geolocation error:", err);
      // Handle specific geolocation error codes
      if (err.code !== undefined) {
        // This is a geolocation error (getCurrentPosition failed)
        if (err.code === 1) {
          toast.error("Location permission denied. Please allow geolocation in your browser settings. This app requires HTTPS or localhost for geolocation to work.");
        } else if (err.code === 2) {
          toast.error("Location unavailable. GPS signal may be off or network is limited.");
        } else if (err.code === 3) {
          toast.error("Geolocation timed out. Please try again with a clear view of the sky.");
        } else {
          toast.error("Geolocation error: " + (err.message || "Unknown error"));
        }
      } else {
        // This is a fetch/geocoding error (reverse geocoding failed after good GPS fix)
        if (err.response && err.response.data && err.response.data.address) {
          const addr = err.response.data.address;
          if (!detCity && (addr.city || addr.town || addr.village || addr.metro)) {
            detCity = addr.city || addr.town || addr.village || addr.metro;
            setCity(detCity);
          }
          if (!detPincode && (addr.postcode || addr.code)) {
            detPincode = addr.postcode || addr.code;
            setPincode(detPincode);
          }
        }
        toast.error("Could not detect location. Please enter address manually.");
      }
    } finally {
      setIsLocating(false);
    }
  };

  const setField = (key, value) => {
    if (key === "address") setAddress(value);
    if (key === "city") setCity(value);
    if (key === "pincode") setPincode(value);
    if (key === "phone") setPhone(value);
    if (key === "streetArea") setStreetArea(value);
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (placing || placingRef.current) return;
    const formErrors = validate({ address, city, pincode, phone, streetArea });
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    placingRef.current = true;
    setPlacing(true);
    setPlacedTotal(total);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
      }));
      const fullAddress = `${address} ${streetArea}`.trim();
      const res = await api.post("/orders", {
        items: orderItems,
        address: fullAddress,
        city,
        phone,
        pincode,
        payment_method: payment,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      clearCart();
      setPlacedOrderId(res.data.id);
      setDone(true);
      toast.success("Order placed successfully!");
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Your session expired. Please sign in again.");
        navigate("/signin");
      } else {
        toast.error("Unable to place your order. Please try again.");
      }
      placingRef.current = false;
      setPlacing(false);
    }
  };

  if (done) {
    const paymentMeta = PAYMENT_META[payment] || PAYMENT_META.cod;
    const PaymentIcon = paymentMeta.icon;
    return (
      <motion.div
        className="empty order-success"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.span
          className="success-big-wrap"
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
        >
          <CheckCircle2 size={56} className="success-big" />
        </motion.span>
        <h2>Order Placed Successfully</h2>
        <p>Your groceries are on the way.</p>
        {placedOrderId && (
          <div className="success-details">
            <div className="success-detail-row">
              <span>Order ID</span>
              <strong>#{`GZ-${String(placedOrderId).padStart(4, "0")}`}</strong>
            </div>
            <div className="success-detail-row">
              <span>Total</span>
              <strong>{formatINR(placedTotal)}</strong>
            </div>
            <div className="success-detail-row">
              <span>Payment</span>
              <strong>
                <PaymentIcon size={14} /> {paymentMeta.title}
              </strong>
            </div>
          </div>
        )}
        <div className="empty-actions">
          <Link to="/orders" className="btn btn-primary">
            View Orders
          </Link>
          <button className="btn btn-outline" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
          {placedOrderId && (
            <Link to={`/track/${placedOrderId}`} className="btn btn-outline">
              Track Order
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  const fieldError = (k) => (errors[k] ? <p id={`checkout-${k}-err`} className="field-error">{errors[k]}</p> : null);

  return (
    <div className="checkout-page">
      <button className="back-link" onClick={() => navigate("/cart")}>
        <ChevronLeft size={16} /> Back to Cart
      </button>
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <div className="checkout-main">
          <div className="checkout-section">
            <h3><MapPin size={18} /> Delivery Details</h3>
            <form onSubmit={handleSubmit} className="checkout-form" id="checkout-form-main" noValidate>
              <div className={`checkout-field ${errors.address ? "has-error" : ""}`}>
                <label htmlFor="checkout-address">Delivery Address <span className="req" aria-hidden="true">*</span></label>
                <input
                  id="checkout-address"
                  placeholder="House / Flat / Door No"
                  value={address}
                  onChange={(e) => setField("address", e.target.value)}
                  autoComplete="street-address"
                  aria-invalid={!!errors.address}
                  aria-describedby={errors.address ? "checkout-address-err" : undefined}
                />
                {fieldError("address")}
              </div>
              <div className="checkout-row">
                <div className={`checkout-field ${errors.streetArea ? "has-error" : ""}`}>
                  <label htmlFor="checkout-street">Street / Area <span className="req" aria-hidden="true">*</span></label>
                  <input
                    id="checkout-street"
                    placeholder="Street / Area / Locality"
                    value={streetArea}
                    onChange={(e) => setField("streetArea", e.target.value)}
                    autoComplete="address-level2"
                    aria-invalid={!!errors.streetArea}
                    aria-describedby={errors.streetArea ? "checkout-street-err" : undefined}
                  />
                  {fieldError("streetArea")}
                </div>
                <div className={`checkout-field ${errors.city ? "has-error" : ""}`}>
                  <label htmlFor="checkout-city">City <span className="req" aria-hidden="true">*</span></label>
                  <input
                    id="checkout-city"
                    placeholder="e.g. Chennai"
                    value={city}
                    onChange={(e) => setField("city", e.target.value)}
                    autoComplete="address-level2"
                    aria-invalid={!!errors.city}
                    aria-describedby={errors.city ? "checkout-city-err" : undefined}
                  />
                  {fieldError("city")}
                </div>
                <div className={`checkout-field ${errors.pincode ? "has-error" : ""}`}>
                  <label htmlFor="checkout-pincode">Pincode <span className="req" aria-hidden="true">*</span></label>
                  <input
                    id="checkout-pincode"
                    placeholder="6-digit pincode"
                    value={pincode}
                    onChange={(e) => setField("pincode", e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    aria-invalid={!!errors.pincode}
                    aria-describedby={errors.pincode ? "checkout-pincode-err" : undefined}
                  />
                  {fieldError("pincode")}
                </div>
              </div>
              <div className={`checkout-field ${errors.phone ? "has-error" : ""}`}>
                <label htmlFor="checkout-phone">Phone Number <span className="req" aria-hidden="true">*</span></label>
                <input
                  id="checkout-phone"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setField("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "checkout-phone-err" : undefined}
                />
                {fieldError("phone")}
              </div>
              <button type="button" className="locate-btn" onClick={captureLocation} disabled={isLocating}>
                <LocateFixed size={15} />
                {isLocating ? "Detecting location…" : (coords ? "Delivery location captured" : "Use my current location")}
              </button>
            </form>
          </div>

          <div className="checkout-section">
            <h3>Payment Method</h3>
            <div className="payment-options" role="radiogroup" aria-label="Payment method">
              {Object.keys(PAYMENT_META).map((key) => {
                const meta = PAYMENT_META[key];
                const Icon = meta.icon;
                const active = payment === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`payment-option ${active ? "active" : ""}`}
                    onClick={() => setPayment(key)}
                  >
                    <Icon size={22} aria-hidden="true" />
                    <div>
                      <strong>{meta.title}</strong>
                      <span>{meta.desc}</span>
                    </div>
                    <span className={`radio-dot ${active ? "on" : ""}`} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="checkout-section">
            <h3><PackageCheck size={18} /> Order Items</h3>
            <div className="checkout-items">
              {items.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <img
                    src={item.image_url || FALLBACK_IMG}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  />
                  <div className="checkout-item-info">
                    <span className="checkout-item-name">{item.name}</span>
                    <span className="checkout-item-qty">Qty {item.quantity} × {formatINR(item.price)}</span>
                  </div>
                  <span className="checkout-item-price">{formatINR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cart-summary checkout-summary">
          <h3 className="summary-title">Price Summary</h3>
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
            type="submit"
            form="checkout-form-main"
            className="btn btn-primary btn-block checkout-submit-desktop"
            disabled={placing}
          >
            {placing ? (
              <>
                <Loader2 size={18} className="spin" /> Placing Order…
              </>
            ) : (
              <>Place Order · {formatINR(total)}</>
            )}
          </button>
          <p className="security-note">
            {user ? `Delivering to ${user.name}` : ""}{payment === "gpay" ? " · GPay QR at delivery" : " · Pay on delivery"}
          </p>
        </div>
      </div>

      <div className="checkout-sticky-cta">
        <div className="cart-sticky-meta">
          <span>{itemsCount} item{itemsCount > 1 ? "s" : ""}</span>
          <strong>{formatINR(total)}</strong>
        </div>
        <button
          type="submit"
          form="checkout-form-main"
          className="btn btn-primary"
          disabled={placing}
        >
          {placing ? (
            <>
              <Loader2 size={16} className="spin" /> Placing…
            </>
          ) : (
            <>Place Order</>
          )}
        </button>
      </div>

      {placing && (
        <div className="checkout-placing-overlay" role="status" aria-live="assertive">
          <span className="spinner-ring" />
          <p>Placing your order…</p>
        </div>
      )}
    </div>
  );
}




