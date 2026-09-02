import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";

export default function CategoryFilter({ categories, active, onSelect }) {
  return (
    <div className="category-filter">
      <motion.button
        className={`category-btn ${active === "" ? "active" : ""}`}
        onClick={() => onSelect("")}
        whileTap={{ scale: 0.95 }}
      >
        <LayoutGrid size={14} /> All
      </motion.button>
      {categories.map((cat) => (
        <motion.button
          key={cat}
          className={`category-btn ${active === cat ? "active" : ""}`}
          onClick={() => onSelect(cat)}
          whileTap={{ scale: 0.95 }}
        >
          {cat}
        </motion.button>
      ))}
    </div>
  );
}
