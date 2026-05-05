import { useState, useEffect, useCallback } from "react";
import PuzzleBoard from "./components/PuzzleBoard";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Legend from "./components/Legend";
import WinModal from "./components/WinModal";

const API = "http://localhost:8000";

export default function App() {
  const [gridSize, setGridSize] = useState(6);
  const [anchors, setAnchors] = useState([]);
  const [patches, setPatches] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [won, setWon] = useState(false);
  const [hintIdx, setHintIdx] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  const fetchPuzzle = useCallback(
    async (size = gridSize) => {
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
        setTimerActive(true);
      } catch {
        setError(
          "Cannot reach backend. Make sure FastAPI is running on port 8000.",
        );
      } finally {
        setLoading(false);
      }
    },
    [gridSize],
  );

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const handlePatchPlaced = useCallback(
    (patch, replaceIdxs = []) => {
      setHistory((h) => [...h, patches]);

      setPatches((p) => {
        // Remove any patches that were merged into the new one
        let next = p.filter((_, i) => !replaceIdxs.includes(i));
        // The patch already contains the correct anchor color
        next = [...next, patch];
        
        const covered = next.reduce((s, q) => s + q.h * q.w, 0);
        if (covered === gridSize * gridSize && next.length === anchors.length) {
          setWon(true);
          setTimerActive(false);
        }
        return next;
      });

      setHintIdx(null);
    },
    [patches, anchors, gridSize],
  );

  const handlePatchDeleted = useCallback(
    (idx) => {
      setHistory((h) => [...h, patches]);
      setPatches((p) => p.filter((_, i) => i !== idx));
      setWon(false);
    },
    [patches]
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    setPatches(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setWon(false);
  };

  const handleHint = () => {
    const coveredSet = new Set(
      patches.flatMap((p) =>
        anchors
          .map((a, i) =>
            a.r >= p.r && a.r < p.r + p.h && a.c >= p.c && a.c < p.c + p.w
              ? i
              : -1,
          )
          .filter((i) => i !== -1),
      ),
    );
    const uncovered = anchors
      .map((_, i) => i)
      .filter((i) => !coveredSet.has(i));
    if (!uncovered.length) return;
    const pick = uncovered[Math.floor(Math.random() * uncovered.length)];
    setHintIdx(pick);
    setTimeout(() => setHintIdx(null), 2000);
  };

  const handleNewGame = (size) => {
    setGridSize(size);
    fetchPuzzle(size);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm flex flex-col gap-3">
        <Header
          elapsed={elapsed}
          gridSize={gridSize}
          onNewGame={handleNewGame}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm leading-relaxed">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm">
            Generating puzzle…
          </div>
        ) : (
          <PuzzleBoard
            gridSize={gridSize}
            anchors={anchors}
            patches={patches}
            hintIdx={hintIdx}
            onPatchPlaced={handlePatchPlaced}
            onPatchDeleted={handlePatchDeleted}
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