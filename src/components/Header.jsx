function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Header({ elapsed, gridSize, onNewGame }) {
  const difficulties = [
    { label: "Easy", size: 6 },
    { label: "Med",  size: 8 },
    { label: "Hard", size: 10 },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-base font-semibold text-gray-800">
        <span className="text-sm">⏱</span>
        <span className="tabular-nums">{formatTime(elapsed)}</span>
      </div>

      <div className="flex gap-1.5">
        {difficulties.map(({ label, size }) => (
          <button
            key={size}
            onClick={() => onNewGame(size)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
              ${gridSize === size
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
              }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
