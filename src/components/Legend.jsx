function ShapeIcon({ type }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
      {type === "square" && (
        <rect x="2" y="2" width="14" height="14" rx="2" fill="none" stroke="#777" strokeWidth="1.5" />
      )}
      {type === "tall" && (
        <rect x="5" y="1" width="8" height="16" rx="2" fill="none" stroke="#777" strokeWidth="1.5" />
      )}
      {type === "wide" && (
        <rect x="1" y="5" width="16" height="8" rx="2" fill="none" stroke="#777" strokeWidth="1.5" />
      )}
      {type === "any" && (
        <circle cx="9" cy="9" r="6" fill="none" stroke="#777" strokeWidth="1.5" strokeDasharray="3 2" />
      )}
    </svg>
  );
}

const items = [
  { type: "square", label: "Square" },
  { type: "tall",   label: "Tall rectangle" },
  { type: "wide",   label: "Wide rectangle" },
  { type: "any",    label: "Any of the above" },
];

export default function Legend() {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-gray-700 text-center">
        Complete each shape to fill the grid
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {items.map(({ type, label }) => (
          <div key={type} className="flex items-center gap-2">
            <ShapeIcon type={type} />
            <span className="text-xs font-medium text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center italic">
        If a shape has a number, it must be that size.
      </p>
    </div>
  );
}
