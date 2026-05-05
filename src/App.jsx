import { useState, useEffect, useCallback } from "react";
import PuzzleBoard from "./components/PuzzleBoard";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Legend from "./components/Legend";
import WinModal from "./components/WinModal";
import "./App.css";

const API = "http://localhost:8000";

const PATCH_COLORS = [
  "#c8a830", "#4db38a", "#9b72c8", "#38b8c8",
  "#e05030", "#50b8a0", "#e07830", "#c05080",
  "#5890e0", "#80c040", "#e0a030", "#7070d0",
];

function getRandomColor(idx) {
  return PATCH_COLORS[idx % PATCH_COLORS.length];
}

export default function App() {
  const [gridSize, setGridSize] = useState(6);
  const [anchors, setAnchors] = useState([]);
  const [patches, setPatches] = useState([]);   // { r, c, h, w, color }
  const [history, setHistory] = useState([]);    // stack for undo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [won, setWon] = useState(false);
  const [hintIdx, setHintIdx] = useState(null);  // index of anchor being hinted
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  const fetchPuzzle = useCallback(async (size = gridSize) => {
    setLoading(true);
    setError("");
    setWon(false);
    setHintIdx(null);
    setElapsed(0);
    setTimerActive(false);
    try {
      const res = await fetch(`${API}/generate-patches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size }),
      });
      const data = await res.json();
      setAnchors(data.anchors);
      setPatches([]);
      setHistory([]);
      setColorIdx(0);
      setTimerActive(true);
    } catch {
      setError("Cannot reach backend. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, [gridSize]);

  useEffect(() => { fetchPuzzle(); }, []);

  const handlePatchPlaced = useCallback((patch) => {
    const color = getRandomColor(colorIdx);
    const newPatch = { ...patch, color };
    setHistory(h => [...h, patches]);
    setPatches(p => {
      const next = [...p, newPatch];
      checkWin(next);
      return next;
    });
    setColorIdx(c => c + 1);
    setHintIdx(null);
  }, [patches, colorIdx, anchors, gridSize]);

  const checkWin = (currentPatches) => {
    const covered = currentPatches.reduce((s, p) => s + p.h * p.w, 0);
    if (covered === gridSize * gridSize && currentPatches.length === anchors.length) {
      setWon(true);
      setTimerActive(false);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setPatches(prev);
    setHistory(h => h.slice(0, -1));
    setColorIdx(c => Math.max(0, c - 1));
    setWon(false);
  };

  const handleHint = () => {
    // Find first anchor that isn't covered by a user patch
    const coveredAnchors = new Set(
      patches.flatMap(p =>
        anchors
          .map((a, i) => (a.r >= p.r && a.r < p.r + p.h && a.c >= p.c && a.c < p.c + p.w ? i : -1))
          .filter(i => i !== -1)
      )
    );
    const uncovered = anchors.map((_, i) => i).filter(i => !coveredAnchors.has(i));
    if (uncovered.length === 0) return;
    const pick = uncovered[Math.floor(Math.random() * uncovered.length)];
    setHintIdx(pick);
    setTimeout(() => setHintIdx(null), 2000);
  };

  const handleNewGame = (size) => {
    setGridSize(size);
    fetchPuzzle(size);
  };

  return (
    <div className="app-shell">
      <div className="game-card">
        <Header
          elapsed={elapsed}
          gridSize={gridSize}
          onNewGame={handleNewGame}
        />

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading">Generating puzzle…</div>
        ) : (
          <PuzzleBoard
            gridSize={gridSize}
            anchors={anchors}
            patches={patches}
            hintIdx={hintIdx}
            onPatchPlaced={handlePatchPlaced}
          />
        )}

        <Footer
          onUndo={handleUndo}
          onHint={handleHint}
          canUndo={history.length > 0}
        />

        <Legend />
      </div>

      {won && (
        <WinModal
          elapsed={elapsed}
          patches={patches.length}
          gridSize={gridSize}
          onNewGame={() => handleNewGame(gridSize)}
        />
      )}
    </div>
  );
}
