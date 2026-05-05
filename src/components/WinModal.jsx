function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function WinModal({ elapsed, patches, gridSize, onNewGame }) {
  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 animate-fade-overlay">
      <div className="bg-white rounded-2xl shadow-2xl px-9 py-8 flex flex-col items-center gap-4
                      min-w-[260px] animate-slide-up">
        <span className="text-4xl">🎉</span>
        <h2 className="text-xl font-bold text-gray-800">Puzzle Solved!</h2>

        <div className="flex gap-5">
          {[
            { label: "Time",    value: formatTime(elapsed) },
            { label: "Patches", value: patches },
            { label: "Grid",    value: `${gridSize}×${gridSize}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {label}
              </span>
              <span className="text-xl font-bold text-gray-800 tabular-nums">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onNewGame}
          className="mt-1 px-8 py-2.5 bg-gray-800 text-white text-sm font-semibold
                     rounded-xl hover:bg-gray-700 active:bg-gray-900 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
