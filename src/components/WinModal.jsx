import { useState, useEffect, useRef } from "react";

function formatTime(s) {
  const val = Number(s) || 0;
  const m = Math.floor(val / 60);
  const sec = Math.floor(val % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function WinModal({ elapsed, versionId, gridSize, sessionId, API, onSuccess, onClose }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Guard to prevent double-logging the auto-save
  const hasAutoSaved = useRef(false);

  useEffect(() => {
    if (hasAutoSaved.current) return;
    hasAutoSaved.current = true;

    fetch(`${API}/submit-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Candidate",
        elapsed_seconds: elapsed,
        version_id: versionId,
        grid_size: gridSize,
        session_id: sessionId,
        is_final: false // Auto-save Ghost Mode
      })
    }).catch((err) => console.error("Auto-save failed", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return alert("Please enter your name!");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/submit-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          elapsed_seconds: elapsed,
          version_id: versionId,
          grid_size: gridSize,
          session_id: sessionId,
          is_final: true // Finalizes for Leaderboard
        })
      });
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (e) {
      alert("Failed to submit score.");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 animate-fade-overlay">
      <div className="relative bg-white rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center gap-4 min-w-[300px] animate-slide-up">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isSubmitted ? (
          <>
            <span className="text-5xl mb-2">🎉</span>
            <h2 className="text-2xl font-black text-gray-800">Score Submitted!</h2>
            <p className="text-gray-500 text-sm mb-4 text-center font-medium">
              Your time of <span className="font-bold text-gray-800">{formatTime(elapsed)}</span> has been securely recorded.
            </p>
            
            <button
              onClick={onSuccess}
              className="w-full mt-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold uppercase tracking-wide rounded-xl hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-lg"
            >
              View Leaderboard
            </button>
          </>
        ) : (
          <>
            <span className="text-4xl">🎉</span>
            <h2 className="text-2xl font-bold text-gray-800">Puzzle Solved!</h2>
            
            <div className="text-3xl font-black text-blue-600 tabular-nums">
              {formatTime(elapsed)}
            </div>

            <div className="w-full mt-2">
              <input 
                type="text" 
                placeholder="Enter your name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center font-bold text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-2 px-8 py-3 bg-blue-600 text-white text-sm font-bold uppercase tracking-wide rounded-xl hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/30"
            >
              {submitting ? "Submitting..." : "Submit Score"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}