export default function Footer({ onUndo, onHint, canUndo }) {
  return (
    <div className="flex gap-2.5">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-100
                   text-sm font-semibold text-gray-600 transition-colors
                   hover:bg-gray-200 active:bg-gray-300
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Undo
      </button>
      <button
        onClick={onHint}
        className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-100
                   text-sm font-semibold text-gray-600 transition-colors
                   hover:bg-gray-200 active:bg-gray-300"
      >
        Hint
      </button>
    </div>
  );
}
