import "./Header.css";

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Header({ elapsed, gridSize, onNewGame }) {
  return (
    <div className="header">
      <div className="timer">
        <span className="timer-icon">⏱</span>
        <span className="timer-val">{formatTime(elapsed)}</span>
      </div>

      <div className="diff-picker">
        {[
          { label: "Easy", size: 6 },
          { label: "Med", size: 8 },
          { label: "Hard", size: 10 },
        ].map(({ label, size }) => (
          <button
            key={size}
            className={`diff-btn ${gridSize === size ? "active" : ""}`}
            onClick={() => onNewGame(size)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
