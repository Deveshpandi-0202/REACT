import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBasket } from "lucide-react";

export default function SplashScreen({ onDone }) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExit(true), 2100);
    return () => clearTimeout(t);
  }, []);

  const handleExitComplete = () => onDone();

  return (
    <motion.div
      className="splash-screen"
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      onAnimationComplete={exit ? handleExitComplete : undefined}
    >
      <div className="splash-bg">
        <div className="splash-orb splash-orb-1" />
        <div className="splash-orb splash-orb-2" />
        <div className="splash-orb splash-orb-3" />
      </div>

      <div className="splash-content">
        <motion.div
          className="splash-logo"
          initial={{ y: 30, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="splash-logo-badge">
            <ShoppingBasket size={34} />
          </div>
        </motion.div>

        <motion.h1
          className="splash-title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: exit ? 0 : 1, y: exit ? -8 : 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          GRO<span>ZO</span>
        </motion.h1>

        <motion.p
          className="splash-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: exit ? 0 : 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Fresh groceries. Fast delivery.
        </motion.p>

        <motion.div
          className="splash-produce"
          initial={{ opacity: 0, scale: 0.8, y: 24 }}
          animate={{ opacity: exit ? 0 : 1, scale: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="splash-fruit f1">🍎</span>
          <span className="splash-fruit f2">🥬</span>
          <span className="splash-fruit f3">🥛</span>
          <span className="splash-fruit f4">🍊</span>
          <span className="splash-fruit f5">🍞</span>
        </motion.div>

        <motion.div
          className="splash-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="splash-progress">
            <motion.div
              className="splash-progress-fill"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </div>
          <span className="splash-loading-text">Preparing fresh picks…</span>
        </motion.div>
      </div>
    </motion.div>
  );
}