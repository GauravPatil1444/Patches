export default function Medal({ type }) {
  let medalColor = "#D4AF37"; // Gold default
  let ringColor = "#BD9B2A";
  let letter = "1";

  if (type === "silver") {
    medalColor = "#e2e8f0"; // Brighter silver
    ringColor = "#94a3b8";
    letter = "2";
  } else if (type === "bronze") {
    medalColor = "#CD7F32";
    ringColor = "#B56E24";
    letter = "3";
  }

  return (
    <div className="flex flex-col items-center relative" style={{ width: "60px", height: "80px" }}>
      {/* Ribbons (Fixed to form a proper 'V' shape) */}
      <div className="absolute top-0 left-0 w-full flex justify-center z-0">
        {/* Left Ribbon */}
        <div className="w-4 h-12 bg-red-600 origin-bottom -rotate-[25deg] translate-x-1.5 border-x border-red-800/20 shadow-sm rounded-t-[2px]"></div>
        {/* Right Ribbon */}
        <div className="w-4 h-12 bg-red-600 origin-bottom rotate-[25deg] -translate-x-1.5 border-x border-red-800/20 shadow-sm rounded-t-[2px]"></div>
      </div>
      
      {/* Medal Body */}
      <div 
        className="absolute bottom-0 w-[50px] h-[50px] rounded-full flex items-center justify-center font-extrabold text-2xl border-[3px] shadow-lg z-10"
        style={{ 
          backgroundColor: medalColor, 
          borderColor: ringColor, 
          color: ringColor,
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {letter}
      </div>
    </div>
  );
}