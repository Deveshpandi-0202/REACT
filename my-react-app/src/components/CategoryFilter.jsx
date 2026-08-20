export default function CategoryFilter({ categories, active, onSelect }) {
  return (
    <div className="category-filter">
      <button
        className={`category-btn ${active === "" ? "active" : ""}`}
        onClick={() => onSelect("")}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-btn ${active === cat ? "active" : ""}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
