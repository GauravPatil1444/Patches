function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Header({ elapsed }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
      <div className="text-sm font-black text-gray-800 tracking-wide uppercase">
        Active Grid
      </div>
      <div className="flex items-center gap-1.5 text-base font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
        <span className="text-sm">⏱</span>
        <span className="tabular-nums">{formatTime(elapsed)}</span>
      </div>
    </div>
  );
}