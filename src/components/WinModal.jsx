import "./WinModal.css";

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function WinModal({ elapsed, patches, gridSize, onNewGame }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="win-emoji">🎉</div>
        <h2 className="win-title">Puzzle Solved!</h2>
        <div className="win-stats">
          <div className="win-stat">
            <span className="stat-label">Time</span>
            <span className="stat-val">{formatTime(elapsed)}</span>
          </div>
          <div className="win-stat">
            <span className="stat-label">Patches</span>
            <span className="stat-val">{patches}</span>
          </div>
          <div className="win-stat">
            <span className="stat-label">Grid</span>
            <span className="stat-val">{gridSize}×{gridSize}</span>
          </div>
        </div>
        <button className="win-btn" onClick={onNewGame}>
          Play Again
        </button>
      </div>
    </div>
  );
}
