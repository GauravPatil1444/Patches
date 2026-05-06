import { useEffect, useState, useCallback } from "react";
import Medal from "./Medal";

function formattedString(candidate) {
  if (!candidate) return "";
  let gridStr = candidate.grid_size;
  if (!gridStr || gridStr.toLowerCase().includes("none")) {
    gridStr = "(8x8)";
  }
  return `Grid ${gridStr} | ${candidate.time}`;
}

function PodiumCard({ position, candidate, type, tag, cardColor }) {
  if (!candidate) {
    return (
      <div className={`p-8 rounded-[40px] shadow-lg w-full lg:flex-1 flex flex-col items-center justify-center text-center opacity-70 ${cardColor}`}>
        <div className="w-[80px] h-[80px] border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center mb-4 text-gray-500 font-bold">
          {type === 'gold' ? '1st' : type === 'silver' ? '2nd' : '3rd'}
        </div>
        <div className="text-gray-500 font-medium">Position Pending...</div>
      </div>
    );
  }

  return (
    <div className={`p-8 rounded-[40px] shadow-xl w-full lg:flex-1 flex flex-col items-center justify-center text-center relative ${cardColor}`}>
      {tag && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-white font-extrabold text-xs px-5 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
          {tag}
        </div>
      )}
      
      <div className="mb-4">
        <Medal type={type} />
      </div>

      <div className="font-extrabold text-2xl text-gray-800 leading-tight mb-2 truncate w-full px-2">
        {candidate.name}
      </div>
      <div className="font-mono text-[11px] sm:text-xs text-amber-950 font-bold uppercase tracking-wide">
        {formattedString(candidate)}
      </div>
    </div>
  );
}

export default function Leaderboard({ onBack, API }) {
  const [scores, setScores] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(() => {
    setLoading(true);
    fetch(`${API}/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setScores(data.leaderboard || []);
        setTotalGames(data.total_games || 0); 
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const first = scores[0];
  const second = scores[1];
  const third = scores[2];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center py-6 sm:py-10 px-4 sm:px-6">
      <div className="w-full max-w-6xl">
        <button onClick={onBack} className="mb-6 sm:mb-10 text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors">
          ← Exit Talent Pool
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-800 leading-none">Talent Pool</h1>
            <p className="text-gray-600 text-sm mt-2 font-medium">
              Live candidate performance tracking for <span className="font-bold text-blue-700">Active Grid</span>
            </p>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
            <button 
              onClick={fetchScores}
              className="flex items-center justify-center gap-2 px-6 py-3 w-full md:w-auto bg-slate-950 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition active:scale-95"
            >
              <span className="text-lg">↺</span>
              Refresh Insights
            </button>
            
            <div className="font-mono text-xs font-bold text-gray-700 uppercase tracking-wide bg-gray-200/60 px-4 py-2 rounded-lg w-full md:w-auto text-center md:text-right">
              GRID TOTAL GAMES: <span className="text-blue-700 text-sm font-extrabold ml-1">{totalGames}</span>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-semibold animate-pulse">Loading Talent Pool...</div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-stretch w-full max-w-4xl mx-auto">
              <div className="w-full lg:flex-1 order-2 lg:order-1 flex mt-0 lg:mt-8">
                <PodiumCard 
                  candidate={second}
                  type="silver"
                  cardColor="bg-sky-100 border border-sky-200"
                />
              </div>
              
              <div className="w-full lg:flex-1 order-1 lg:order-2 flex z-10">
                <PodiumCard 
                  candidate={first}
                  type="gold"
                  tag="TOP CANDIDATE"
                  cardColor="bg-amber-100 border border-amber-200 shadow-amber-900/10"
                />
              </div>
              
              <div className="w-full lg:flex-1 order-3 lg:order-3 flex mt-0 lg:mt-12">
                <PodiumCard 
                  candidate={third}
                  type="bronze"
                  cardColor="bg-orange-100 border border-orange-200"
                />
              </div>
            </div>

            {scores.length > 0 && (
              <div className="mt-16 w-full">
                <h2 className="text-xl font-black text-gray-800 mb-5 pl-2">Full Leaderboard</h2>
                
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[600px] text-left">
                      <thead className="bg-gray-800 text-white">
                        <tr className="text-xs font-black uppercase tracking-widest">
                          <th className="p-5 text-center w-20">Rank</th>
                          <th className="p-5 text-center">Candidate</th>
                          <th className="p-5 text-center">Grid</th>
                          <th className="p-5 text-center">Time</th>
                          <th className="p-5 text-center">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {scores.map((d, index) => {
                          const safeGrid = (!d.grid_size || d.grid_size.toLowerCase().includes("none")) ? "(8x8)" : d.grid_size;
                          return (
                            <tr key={index} className="hover:bg-blue-50/50 transition duration-150">
                              <td className="p-5 text-center font-black text-gray-400">#{index + 1}</td>
                              <td className="p-5 text-center font-extrabold text-gray-800 truncate max-w-[200px]">{d.name}</td>
                              <td className="p-5 text-center text-sm font-bold text-gray-500">{safeGrid}</td>
                              <td className="p-5 text-center font-mono text-blue-600 font-bold">{d.time}</td>
                              <td className="p-5 text-center text-sm font-bold text-gray-500 whitespace-nowrap">
                                {new Date(d.date).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}