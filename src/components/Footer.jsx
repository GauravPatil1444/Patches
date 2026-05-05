import "./Footer.css";

export default function Footer({ onUndo, onHint, canUndo }) {
  return (
    <div className="footer">
      <button className="foot-btn" onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button className="foot-btn" onClick={onHint}>
        Hint
      </button>
    </div>
  );
}
