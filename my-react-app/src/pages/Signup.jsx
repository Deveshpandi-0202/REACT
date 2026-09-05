import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Loader2, Mail, UserRound, Phone, Eye, EyeOff, ArrowRight, Leaf } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = "Enter a valid email";
    if (!phone.trim()) errs.phone = "Phone is required";
    else if (!/^\d{10}$/.test(phone.trim())) errs.phone = "Enter a 10-digit phone number";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), phone.trim(), password);
      toast.success("Account created! Please sign in.");
      navigate("/signin");
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-orb auth-orb-3" />
        <div className="auth-brand-orb auth-orb-4" />
        <motion.div
          className="auth-brand-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-brand-logo">
            <Leaf size={26} />
          </div>
          <h2>Join the freshness club</h2>
          <p>Create your account and get premium groceries delivered to your doorstep.</p>
          <div className="auth-brand-cards" aria-hidden="true">
            <span className="ab-card ab-card-1">🍓 Fruits</span>
            <span className="ab-card ab-card-2">🧀 Dairy</span>
            <span className="ab-card ab-card-3">🥦 Veggies</span>
            <span className="ab-card ab-card-4">🛒 Daily</span>
          </div>
        </motion.div>
      </div>

      <div className="auth-main">
        <motion.form
          className="auth-form premium"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          noValidate
        >
          <div className="auth-head">
            <div className="auth-mini-logo"><UserPlus size={20} /></div>
            <h2>Create Account</h2>
            <p className="auth-sub">Fresh groceries are just a few clicks away</p>
          </div>

          <div className={`form-field ${errors.name ? "has-error" : ""}`}>
            <label htmlFor="signup-name">Full Name</label>
            <div className="input-wrap">
              <UserRound size={17} className="input-icon" />
              <input
                id="signup-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.name}
              />
            </div>
            <span className="field-error">{errors.name}</span>
          </div>

          <div className={`form-field ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="signup-email">Email</label>
            <div className="input-wrap">
              <Mail size={17} className="input-icon" />
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
            </div>
            <span className="field-error">{errors.email}</span>
          </div>

          <div className={`form-field ${errors.phone ? "has-error" : ""}`}>
            <label htmlFor="signup-phone">Phone</label>
            <div className="input-wrap">
              <Phone size={17} className="input-icon" />
              <input
                id="signup-phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                autoComplete="tel"
                aria-invalid={!!errors.phone}
              />
            </div>
            <span className="field-error">{errors.phone}</span>
          </div>

          <div className={`form-field ${errors.password ? "has-error" : ""}`}>
            <label htmlFor="signup-password">Password</label>
            <div className="input-wrap">
              <input
                id="signup-password"
                type={showPwd ? "text" : "password"}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span className="field-error">{errors.password}</span>
          </div>

          <div className={`form-field ${errors.confirmPassword ? "has-error" : ""}`}>
            <label htmlFor="signup-confirm">Confirm Password</label>
            <div className="input-wrap">
              <input
                id="signup-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span className="field-error">{errors.confirmPassword}</span>
          </div>

          <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Creating account…
              </>
            ) : (
              <>
                Create Account <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="auth-link">
            Already have an account? <Link to="/signin">Sign In</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}