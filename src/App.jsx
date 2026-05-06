import { useState, useEffect, useCallback } from "react";
import PuzzleBoard from "./components/PuzzleBoard";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Legend from "./components/Legend";
import WinModal from "./components/WinModal";
import Leaderboard from "./components/LeaderboardPodium"; 
import AdminPanel from "./components/AdminPanel";

const API = "http://localhost:8000";

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const isAdminRoute = queryParams.get("admin") === "true";

  const [currentView, setCurrentView] = useState(isAdminRoute ? "admin" : "game");
  
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
  const [versionId, setVersionId] = useState("");
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  const fetchPuzzle = useCallback(async () => {
    setLoading(true);
    setError("");
    setWon(false);
    setHintIdx(null);
    setElapsed(0);
    setTimerActive(false); // Pauses timer until user interacts
    setSessionId(Math.random().toString(36).substring(2) + Date.now().toString(36));
    
    try {
      const res = await fetch(`${API}/active-puzzle`);
      const data = await res.json();
      setGridSize(data.size);
      setAnchors(data.anchors);
      setVersionId(data.version_id);
      setPatches([]);
      setHistory([]);
    } catch {
      setError("Cannot reach backend. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === "game") fetchPuzzle();
  }, [currentView, fetchPuzzle]);

  const handlePatchPlaced = useCallback((patch, replaceIdxs = []) => {
    setHistory((h) => [...h, patches]);
    setPatches((p) => {
      let next = p.filter((_, i) => !replaceIdxs.includes(i));
      next = [...next, patch];
      
      const covered = next.reduce((s, q) => s + q.h * q.w, 0);
      if (covered === gridSize * gridSize && next.length === anchors.length) {
        setWon(true);
        setTimerActive(false);
      }
      return next;
    });
    setHintIdx(null);
  }, [patches, anchors, gridSize]);

  const handlePatchDeleted = useCallback((idx) => {
    setHistory((h) => [...h, patches]);
    setPatches((p) => p.filter((_, i) => i !== idx));
    setWon(false);
  }, [patches]);

  const handleUndo = () => {
    if (history.length === 0) return;
    setPatches(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setWon(false);
  };

  const handleHint = () => {
    const coveredSet = new Set(
      patches.flatMap((p) =>
        anchors.map((a, i) =>
          a.r >= p.r && a.r < p.r + p.h && a.c >= p.c && a.c < p.c + p.w ? i : -1
        ).filter((i) => i !== -1)
      )
    );
    const uncovered = anchors.map((_, i) => i).filter((i) => !coveredSet.has(i));
    if (!uncovered.length) return;
    const pick = uncovered[Math.floor(Math.random() * uncovered.length)];
    setHintIdx(pick);
    setTimeout(() => setHintIdx(null), 2000);
  };

  const goLeaderboard = () => setCurrentView("leaderboard");
  const goGame = () => {
    if (isAdminRoute) {
      window.history.pushState({}, document.title, window.location.pathname);
    }
    setCurrentView("game");
  };

  if (currentView === "leaderboard") return <Leaderboard onBack={goGame} API={API} />;
  if (currentView === "admin") return <AdminPanel onBack={goGame} API={API} />;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm flex justify-start mb-4">
        <button onClick={goLeaderboard} className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
          🏆 View Leaderboard
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm flex flex-col gap-3">
        <Header elapsed={elapsed} />

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm font-semibold">Loading Active Puzzle…</div>
        ) : (
          <PuzzleBoard
            gridSize={gridSize}
            anchors={anchors}
            patches={patches}
            hintIdx={hintIdx}
            onPatchPlaced={handlePatchPlaced}
            onPatchDeleted={handlePatchDeleted}
            onInteraction={() => {
              if (!timerActive && !won) setTimerActive(true);
            }}
          />
        )}

        <Footer onUndo={handleUndo} onHint={handleHint} canUndo={history.length > 0} />
        <Legend />
      </div>

      {won && (
        <WinModal
          elapsed={elapsed}
          versionId={versionId}
          gridSize={gridSize}
          sessionId={sessionId}
          API={API}
          onSuccess={() => { setWon(false); goLeaderboard(); }}
          onClose={() => setWon(false)}
        />
      )}
    </div>
  );
}