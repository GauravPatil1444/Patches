import { useState } from "react";

export default function AdminPanel({ onBack, API }) {
  const [password, setPassword] = useState("");
  const [size, setSize] = useState(8);
  const [loading, setLoading] = useState(false);

  const handleRotate = async () => {
    if (!password) return alert("Password required");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, size: Number(size) })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Global Grid Rotated Successfully!\nLeaderboard has been reset for the new puzzle.");
        setPassword("");
      } else {
        alert(`Error: ${data.detail || "Authentication Failed"}`);
      }
    } catch (e) {
      alert("Failed to reach server.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-6 text-sm font-bold text-slate-400 hover:text-white">
          ← Exit Control Center
        </button>

        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-2">Command Center</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Generating a new puzzle will instantly update the active challenge for all players and clear the current leaderboard.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Grid Size</label>
              <select 
                value={size} 
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500"
              >
                <option value={6}>Easy (6x6)</option>
                <option value={8}>Medium (8x8)</option>
                <option value={10}>Hard (10x10)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Admin Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 font-mono"
                placeholder="••••••••"
              />
            </div>

            <button 
              onClick={handleRotate}
              disabled={loading}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-900/50"
            >
              {loading ? "Executing..." : "Rotate Challenge"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}