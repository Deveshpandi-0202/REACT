import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Loader2, Mail, Eye, EyeOff, Leaf, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { signin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()) && email.trim() !== "admin123") errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await signin(email.trim(), password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "driver") navigate("/driver");
      else navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-orb auth-orb-1" />
        <div className="auth-brand-orb auth-orb-2" />
        <motion.div
          className="auth-brand-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-brand-logo">
            <Leaf size={26} />
          </div>
          <h2>Fresh &amp; Fast, Every Day</h2>
          <p>Premium groceries sourced fresh and delivered to your doorstep in minutes.</p>
          <div className="auth-brand-tags">
            <span><Truck size={15} /> 30-min delivery</span>
            <span><ShieldCheck size={15} /> Farm fresh quality</span>
            <span><Leaf size={15} /> Best prices</span>
          </div>
          <div className="auth-brand-cards" aria-hidden="true">
            <span className="ab-card ab-card-1">🍎 Fruits</span>
            <span className="ab-card ab-card-2">🥬 Veggies</span>
            <span className="ab-card ab-card-3">🥛 Dairy</span>
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
            <div className="auth-mini-logo"><LogIn size={20} /></div>
            <h2>Welcome Back</h2>
            <p className="auth-sub">Sign in to continue your grocery run</p>
          </div>

          <div className={`form-field ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="signin-email">Email</label>
            <div className="input-wrap">
              <Mail size={17} className="input-icon" />
              <input
                id="signin-email"
                type="text"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className={`form-field ${errors.password ? "has-error" : ""}`}>
            <label htmlFor="signin-password">Password</label>
            <div className="input-wrap">
              <input
                id="signin-password"
                type={showPwd ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="auth-row-between">
            <button type="button" className="link-btn" onClick={() => setShowForgot(true)}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Signing in…
              </>
            ) : (
              <>
                Sign In <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="auth-link">
            New to GROZO? <Link to="/signup">Create an account</Link>
          </p>

          <div className="auth-demo-hint">
            <strong>Demo accounts</strong>
            <span>User: rahul@test.com / rahul123</span>
            <span>Driver: driver@test.com / driver123</span>
            <span>Admin: admin123 / admin123@gmail.com</span>
          </div>
        </motion.form>
      </div>

      {showForgot && (
        <div className="modal-overlay" onClick={() => setShowForgot(false)}>
          <div className="modal-box" role="dialog" aria-modal="true" aria-label="Forgot password">
            <h3>Forgot Password?</h3>
            <p>
              Password recovery requires admin assistance in this version.
              <br />
              Please contact <strong>support@grozo.in</strong> to reset your password,
              or use a demo account to explore.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowForgot(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}