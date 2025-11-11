import { useTheme } from "../../context/ThemeContext";

const ScoreBadge = ({ score }) => {
  const { darkMode } = useTheme();
  
  const getBadgeClasses = (score) => {
    if (score > 69) {
      return darkMode 
        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
        : "bg-badge-green text-badge-green-text";
    } else if (score > 39) {
      return darkMode 
        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
        : "bg-badge-yellow text-badge-yellow-text";
    } else {
      return darkMode 
        ? "bg-red-500/20 text-red-400 border border-red-500/30" 
        : "bg-badge-red text-badge-red-text";
    }
  };

  return (
    <div
      className={`flex flex-row gap-1 items-center px-2 py-0.5 rounded-[96px] transition-all duration-300 animate-in zoom-in duration-500 ${getBadgeClasses(
        score
      )}`}
    >
      <img
        src={score > 69 ? "/icons/check.svg" : "/icons/warning.svg"}
        alt="score"
        className="size-4 animate-in zoom-in duration-300"
      />
      <p className="text-sm font-medium">{score}/100</p>
    </div>
  );
};

export default ScoreBadge;

