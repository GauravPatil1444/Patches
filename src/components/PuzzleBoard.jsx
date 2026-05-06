import { useState, useRef, useCallback, useEffect } from "react";

const ANCHOR_COLORS = {
  square: "#5b8ee6",
  tall:   "#48b06a",
  wide:   "#e07a30",
  any:    "#999999",
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function AnchorIcon({ type, number, hinted }) {
  const color = ANCHOR_COLORS[type] ?? "#999";
  return (
    <div className={`flex items-center justify-center ${hinted ? "animate-pulse-hint" : ""}`}>
      <svg width="36" height="36" viewBox="0 0 36 36">
        {type === "square" && <rect x="5" y="5" width="26" height="26" rx="4" fill={color} opacity="0.85" />}
        {type === "tall" && <rect x="10" y="3" width="16" height="30" rx="4" fill={color} opacity="0.85" />}
        {type === "wide" && <rect x="3" y="10" width="30" height="16" rx="4" fill={color} opacity="0.85" />}
        {type === "any" && <circle cx="18" cy="18" r="13" fill={color} opacity="0.75" />}
        {number && (
          <text x="18" y="23" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">
            {number}
          </text>
        )}
      </svg>
    </div>
  );
}

function validatePatch(r, c, h, w, anchors, patches, ignoreIdxs = []) {
  const contained = anchors.filter(a => a.r >= r && a.r < r + h && a.c >= c && a.c < c + w);
  if (contained.length === 0) return { ok: false, reason: "No anchor inside patch" };
  if (contained.length > 1)   return { ok: false, reason: "Patch covers multiple anchors" };

  const a = contained[0];
  if (a.type === "square" && h !== w) return { ok: false, reason: "Anchor requires a square" };
  if (a.type === "tall"   && h <= w)  return { ok: false, reason: "Anchor requires tall rectangle" };
  if (a.type === "wide"   && w <= h)  return { ok: false, reason: "Anchor requires wide rectangle" };
  if (a.number && h * w !== a.number) return { ok: false, reason: `Anchor requires area of ${a.number}` };

  const overlaps = patches.some((p, i) => {
    if (ignoreIdxs.includes(i)) return false; 
    return !(r + h <= p.r || r >= p.r + p.h || c + w <= p.c || c >= p.c + p.w);
  });
  
  if (overlaps) return { ok: false, reason: "Overlaps an existing patch" };
  return { ok: true, anchor: a };
}

// NEW: Accept onInteraction prop
export default function PuzzleBoard({ gridSize, anchors, patches, hintIdx, onPatchPlaced, onPatchDeleted, onInteraction }) {
  const [drag, setDrag]         = useState(null);
  const [flashMsg, setFlashMsg] = useState(null);
  const [flashGrid, setFlashGrid] = useState(false);
  const boardRef  = useRef(null);
  const msgTimer  = useRef(null);

  const CELL  = Math.min(56, Math.floor(360 / gridSize));
  const BOARD = CELL * gridSize;

  const getCellFromXY = useCallback((clientX, clientY) => {
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      r: Math.max(0, Math.min(gridSize - 1, Math.floor(y / CELL))),
      c: Math.max(0, Math.min(gridSize - 1, Math.floor(x / CELL))),
    };
  }, [gridSize, CELL]);

  const showFlash = (msg, isError) => {
    clearTimeout(msgTimer.current);
    if (!msg) { setFlashMsg(null); return; }
    setFlashMsg({ msg, isError });
    msgTimer.current = setTimeout(() => setFlashMsg(null), 2200);
  };

  const finalizeDrag = useCallback((endR, endC) => {
    if (!drag) return;
    
    const { startR, startC } = drag;

    if (startR === endR && startC === endC) {
        const clickedIdx = patches.findIndex(p => 
            startR >= p.r && startR < p.r + p.h && startC >= p.c && startC < p.c + p.w
        );
        if (clickedIdx !== -1) {
            if (onPatchDeleted) onPatchDeleted(clickedIdx);
            setDrag(null);
            return;
        }
    }

    let r = Math.min(startR, endR);
    let c = Math.min(startC, endC);
    let h = Math.abs(startR - endR) + 1;
    let w = Math.abs(startC - endC) + 1;

    const overlappingIdxs = patches.map((p, i) => {
      const overlaps = !(r + h <= p.r || r >= p.r + p.h || c + w <= p.c || c >= p.c + p.w);
      return overlaps ? i : -1;
    }).filter(i => i !== -1);

    if (overlappingIdxs.length > 0) {
      let minR = r, minC = c, maxR = r + h, maxC = c + w;
      overlappingIdxs.forEach(idx => {
        const p = patches[idx];
        minR = Math.min(minR, p.r);
        minC = Math.min(minC, p.c);
        maxR = Math.max(maxR, p.r + p.h);
        maxC = Math.max(maxC, p.c + p.w);
      });
      r = minR;
      c = minC;
      h = maxR - minR;
      w = maxC - minC;
    }

    const result = validatePatch(r, c, h, w, anchors, patches, overlappingIdxs);
    if (result.ok) {
      const anchorColor = ANCHOR_COLORS[result.anchor.type] || "#999999";
      onPatchPlaced({ r, c, h, w, color: anchorColor }, overlappingIdxs);
      showFlash(null);
    } else {
      showFlash(result.reason, true);
      setFlashGrid(true);
      setTimeout(() => setFlashGrid(false), 300);
    }
    setDrag(null);
  }, [drag, anchors, patches, onPatchPlaced, onPatchDeleted]);

  const onMouseDown = e => {
    if (onInteraction) onInteraction(); // NEW: Trigger Timer Start
    if (e.button !== 0) return;
    const { r, c } = getCellFromXY(e.clientX, e.clientY);
    setDrag({ startR: r, startC: c, endR: r, endC: c });
  };
  
  const onMouseMove = e => {
    if (!drag) return;
    const { r, c } = getCellFromXY(e.clientX, e.clientY);
    if (r !== drag.endR || c !== drag.endC) setDrag(d => ({ ...d, endR: r, endC: c }));
  };
  
  const onMouseUp = e => {
    if (!drag) return;
    const { r, c } = getCellFromXY(e.clientX, e.clientY);
    finalizeDrag(r, c);
  };

  const onTouchStart = e => {
    if (onInteraction) onInteraction(); // NEW: Trigger Timer Start
    const t = e.touches[0];
    const { r, c } = getCellFromXY(t.clientX, t.clientY);
    setDrag({ startR: r, startC: c, endR: r, endC: c });
  };
  
  const onTouchMove = e => {
    if (!drag) return;
    const t = e.touches[0];
    const { r, c } = getCellFromXY(t.clientX, t.clientY);
    setDrag(d => ({ ...d, endR: r, endC: c }));
  };
  
  const onTouchEnd = e => {
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

  let ghost = null;
  if (drag) {
    let r = Math.min(drag.startR, drag.endR);
    let c = Math.min(drag.startC, drag.endC);
    let h = Math.abs(drag.startR - drag.endR) + 1;
    let w = Math.abs(drag.startC - drag.endC) + 1;

    if (drag.startR !== drag.endR || drag.startC !== drag.endC) {
        const overlappingIdxs = patches.map((p, i) => {
        const overlaps = !(r + h <= p.r || r >= p.r + p.h || c + w <= p.c || c >= p.c + p.w);
        return overlaps ? i : -1;
        }).filter(i => i !== -1);

        if (overlappingIdxs.length > 0) {
        let minR = r, minC = c, maxR = r + h, maxC = c + w;
        overlappingIdxs.forEach(idx => {
            const p = patches[idx];
            minR = Math.min(minR, p.r);
            minC = Math.min(minC, p.c);
            maxR = Math.max(maxR, p.r + p.h);
            maxC = Math.max(maxC, p.c + p.w);
        });
        r = minR;
        c = minC;
        h = maxR - minR;
        w = maxC - minC;
        }
    }
    ghost = { r, c, h, w };
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {flashMsg?.isError && (
        <div className="text-xs font-semibold px-3.5 py-1.5 rounded-full
                        bg-red-50 border border-red-200 text-red-600 animate-fade-in-up">
          {flashMsg.msg}
        </div>
      )}

      <div
        ref={boardRef}
        className={`relative cursor-crosshair rounded-xl overflow-hidden select-none touch-none transition-colors duration-300 ${
          flashGrid ? "bg-red-200" : "bg-gray-50"
        }`}
        style={{ width: BOARD, height: BOARD }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <svg className="absolute inset-0 pointer-events-none" width={BOARD} height={BOARD}>
          {Array.from({ length: gridSize + 1 }).map((_, i) => (
            <g key={i}>
              <line x1={i * CELL} y1={0}     x2={i * CELL} y2={BOARD} stroke="#ddd" strokeWidth="1" />
              <line x1={0}        y1={i*CELL} x2={BOARD}    y2={i*CELL} stroke="#ddd" strokeWidth="1" />
            </g>
          ))}
        </svg>

        {patches.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-[10px] border-2 pointer-events-none z-10 transition-all duration-150"
            style={{
              top:    p.r * CELL + 2,
              left:   p.c * CELL + 2,
              width:  p.w * CELL - 4,
              height: p.h * CELL - 4,
              background: hexToRgba(p.color, 0.82),
              borderColor: p.color,
            }}
          />
        ))}

        {ghost && (
          <div
            className="absolute pointer-events-none z-20 rounded-lg
                       bg-blue-100/40 border-2 border-dashed border-blue-400/60 transition-all duration-150"
            style={{
              top:    ghost.r * CELL + 2,
              left:   ghost.c * CELL + 2,
              width:  ghost.w * CELL - 4,
              height: ghost.h * CELL - 4,
            }}
          />
        )}

        {anchors.map((a, i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center pointer-events-none z-30"
            style={{ top: a.r * CELL, left: a.c * CELL, width: CELL, height: CELL }}
          >
            <AnchorIcon type={a.type} number={a.number} hinted={hintIdx === i} />
          </div>
        ))}

        <div className="absolute inset-0 rounded-xl border-2 border-gray-300 pointer-events-none z-40" />
      </div>
    </div>
  );
}