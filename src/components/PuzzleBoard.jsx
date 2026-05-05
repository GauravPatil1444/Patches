import { useState, useRef, useCallback, useEffect } from "react";
import "./PuzzleBoard.css";

const ANCHOR_COLORS = {
  square: "#5b8ee6",
  tall:   "#48b06a",
  wide:   "#e07a30",
  any:    "#999",
};

function AnchorIcon({ type, number, hinted }) {
  const color = ANCHOR_COLORS[type] ?? "#999";
  const size = 22;

  let shape;
  if (type === "square") {
    shape = <rect x="4" y="4" width="14" height="14" rx="2.5" fill={color} opacity="0.85" />;
  } else if (type === "tall") {
    shape = <rect x="7" y="2" width="8" height="18" rx="2.5" fill={color} opacity="0.85" />;
  } else if (type === "wide") {
    shape = <rect x="2" y="7" width="18" height="8" rx="2.5" fill={color} opacity="0.85" />;
  } else {
    shape = <circle cx="11" cy="11" r="7" fill={color} opacity="0.75" />;
  }

  return (
    <div className={`anchor-wrap ${hinted ? "hinted" : ""}`}>
      <svg width={size} height={size} viewBox="0 0 22 22">
        {shape}
        {number && (
          <text x="11" y="15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
            {number}
          </text>
        )}
      </svg>
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function validatePatch(r, c, h, w, anchors, patches) {
  const contained = anchors.filter(
    a => a.r >= r && a.r < r + h && a.c >= c && a.c < c + w
  );
  if (contained.length === 0) return { ok: false, reason: "No anchor inside patch" };
  if (contained.length > 1) return { ok: false, reason: "Patch covers multiple anchors" };

  const a = contained[0];
  if (a.type === "square" && h !== w) return { ok: false, reason: "Anchor requires a square" };
  if (a.type === "tall" && h <= w)   return { ok: false, reason: "Anchor requires tall rectangle" };
  if (a.type === "wide" && w <= h)   return { ok: false, reason: "Anchor requires wide rectangle" };

  const overlaps = patches.some(
    p => !(r + h <= p.r || r >= p.r + p.h || c + w <= p.c || c >= p.c + p.w)
  );
  if (overlaps) return { ok: false, reason: "Overlaps an existing patch" };

  return { ok: true };
}

export default function PuzzleBoard({ gridSize, anchors, patches, hintIdx, onPatchPlaced }) {
  const [drag, setDrag] = useState(null);
  const [flashMsg, setFlashMsg] = useState(null);
  const boardRef = useRef(null);
  const msgTimer = useRef(null);

  const CELL = Math.min(56, Math.floor(360 / gridSize));
  const BOARD = CELL * gridSize;

  const getCellFromXY = useCallback((clientX, clientY) => {
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const r = Math.max(0, Math.min(gridSize - 1, Math.floor(y / CELL)));
    const c = Math.max(0, Math.min(gridSize - 1, Math.floor(x / CELL)));
    return { r, c };
  }, [gridSize, CELL]);

  const showFlash = (msg, isError) => {
    clearTimeout(msgTimer.current);
    setFlashMsg({ msg, isError });
    msgTimer.current = setTimeout(() => setFlashMsg(null), 2200);
  };

  const finalizeDrag = useCallback((endR, endC) => {
    if (!drag) return;
    const r = Math.min(drag.startR, endR);
    const c = Math.min(drag.startC, endC);
    const h = Math.abs(drag.startR - endR) + 1;
    const w = Math.abs(drag.startC - endC) + 1;
    const result = validatePatch(r, c, h, w, anchors, patches);
    if (result.ok) {
      onPatchPlaced({ r, c, h, w });
      showFlash(null);
    } else {
      showFlash(result.reason, true);
    }
    setDrag(null);
  }, [drag, anchors, patches, onPatchPlaced]);

  // Mouse events
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const { r, c } = getCellFromXY(e.clientX, e.clientY);
    setDrag({ startR: r, startC: c, endR: r, endC: c });
  };
  const onMouseMove = (e) => {
    if (!drag) return;
    const { r, c } = getCellFromXY(e.clientX, e.clientY);
    if (r !== drag.endR || c !== drag.endC) setDrag(d => ({ ...d, endR: r, endC: c }));
  };
  const onMouseUp = (e) => {
    if (!drag) return;
    const { r, c } = getCellFromXY(e.clientX, e.clientY);
    finalizeDrag(r, c);
  };

  // Touch events
  const onTouchStart = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const { r, c } = getCellFromXY(t.clientX, t.clientY);
    setDrag({ startR: r, startC: c, endR: r, endC: c });
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (!drag) return;
    const t = e.touches[0];
    const { r, c } = getCellFromXY(t.clientX, t.clientY);
    setDrag(d => ({ ...d, endR: r, endC: c }));
  };
  const onTouchEnd = (e) => {
    e.preventDefault();
    if (!drag) return;
    const t = e.changedTouches[0];
    const { r, c } = getCellFromXY(t.clientX, t.clientY);
    finalizeDrag(r, c);
  };

  useEffect(() => {
    const up = () => { if (drag) setDrag(null); };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, [drag]);

  // Build ghost rect
  let ghost = null;
  if (drag) {
    const gr = Math.min(drag.startR, drag.endR);
    const gc = Math.min(drag.startC, drag.endC);
    const gh = Math.abs(drag.startR - drag.endR) + 1;
    const gw = Math.abs(drag.startC - drag.endC) + 1;
    ghost = { r: gr, c: gc, h: gh, w: gw };
  }

  return (
    <div className="board-container">
      {flashMsg?.isError && (
        <div className="flash-msg error">{flashMsg.msg}</div>
      )}

      <div
        ref={boardRef}
        className="board"
        style={{ width: BOARD, height: BOARD }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Grid lines */}
        <svg
          className="grid-lines"
          width={BOARD}
          height={BOARD}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {Array.from({ length: gridSize + 1 }).map((_, i) => (
            <g key={i}>
              <line x1={i * CELL} y1={0} x2={i * CELL} y2={BOARD} stroke="#ddd" strokeWidth="1" />
              <line x1={0} y1={i * CELL} x2={BOARD} y2={i * CELL} stroke="#ddd" strokeWidth="1" />
            </g>
          ))}
        </svg>

        {/* Placed patches */}
        {patches.map((p, i) => (
          <div
            key={i}
            className="patch"
            style={{
              top: p.r * CELL + 2,
              left: p.c * CELL + 2,
              width: p.w * CELL - 4,
              height: p.h * CELL - 4,
              background: hexToRgba(p.color, 0.82),
              borderColor: p.color,
              borderRadius: 10,
            }}
          />
        ))}

        {/* Ghost preview */}
        {ghost && (
          <div
            className="patch ghost"
            style={{
              top: ghost.r * CELL + 2,
              left: ghost.c * CELL + 2,
              width: ghost.w * CELL - 4,
              height: ghost.h * CELL - 4,
            }}
          />
        )}

        {/* Anchor icons */}
        {anchors.map((a, i) => (
          <div
            key={i}
            className="anchor-cell"
            style={{
              top: a.r * CELL,
              left: a.c * CELL,
              width: CELL,
              height: CELL,
            }}
          >
            <AnchorIcon type={a.type} number={a.number} hinted={hintIdx === i} />
          </div>
        ))}

        {/* Outer border */}
        <div className="board-border" style={{ width: BOARD, height: BOARD }} />
      </div>
    </div>
  );
}
