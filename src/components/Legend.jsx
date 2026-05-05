import "./Legend.css";

function ShapeIcon({ type }) {
  if (type === "square")
    return (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="2" y="2" width="14" height="14" rx="2" fill="none" stroke="#777" strokeWidth="1.5" />
      </svg>
    );
  if (type === "tall")
    return (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="5" y="1" width="8" height="16" rx="2" fill="none" stroke="#777" strokeWidth="1.5" />
      </svg>
    );
  if (type === "wide")
    return (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1" y="5" width="16" height="8" rx="2" fill="none" stroke="#777" strokeWidth="1.5" />
      </svg>
    );
  // any
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="6" fill="none" stroke="#777" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}

export default function Legend() {
  return (
    <div className="legend-wrap">
      <p className="legend-title">Complete each shape to fill the grid</p>
      <div className="legend-grid">
        {[
          { type: "square", label: "Square" },
          { type: "tall",   label: "Tall rectangle" },
          { type: "wide",   label: "Wide rectangle" },
          { type: "any",    label: "Any of the above" },
        ].map(({ type, label }) => (
          <div className="legend-item" key={type}>
            <ShapeIcon type={type} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="legend-note">If a shape has a number, it must be that size.</p>
    </div>
  );
}
