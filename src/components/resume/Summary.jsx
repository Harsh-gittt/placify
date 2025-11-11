import { useTheme } from "../../context/ThemeContext";
import ScoreGauge from "./ScoreGauge";
import ScoreBadge from "./ScoreBadge";

const Category = ({ title, score }) => {
  const { darkMode } = useTheme();
  const textColor = score > 70 
    ? (darkMode ? "text-green-400" : "text-green-600") 
    : score > 49 
    ? (darkMode ? "text-yellow-400" : "text-yellow-600") 
    : (darkMode ? "text-red-400" : "text-red-600");

  return (
    <div className="resume-summary animate-in fade-in slide-in-from-left-4 duration-500">
      <div className={`category transition-all duration-300 hover:scale-[1.02] ${
        darkMode ? 'bg-[#121212] border-gray-700' : 'bg-gray-50'
      }`}>
        <div className="flex flex-row max-sm:flex-col max-sm:items-start gap-2 items-center justify-center max-sm:justify-start">
          <p className={`text-2xl max-md:text-xl max-sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </p>
          <ScoreBadge score={score} />
        </div>
        <p className={`text-2xl max-md:text-xl max-sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <span className={textColor}>{score}</span>/100
        </p>
      </div>
    </div>
  );
};

const Summary = ({ feedback }) => {
  const { darkMode } = useTheme();
  if (!feedback) return null;

  return (
    <div className={`${darkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white'} border rounded-2xl shadow-lg w-full p-4 max-sm:p-3 transition-all duration-300 animate-in fade-in zoom-in duration-700 hover:shadow-xl`}>
      <div className="flex flex-row max-md:flex-col max-md:items-center items-center p-4 max-sm:p-2 gap-8 max-md:gap-4">
        <div className="animate-in zoom-in duration-1000 delay-200">
          <ScoreGauge score={feedback.overallScore || 0} />
        </div>

        <div className="flex flex-col gap-2 max-md:text-center animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
          <h2 className={`text-2xl max-md:text-xl max-sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Your Resume Score
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            This score is calculated based on the variables listed below.
          </p>
        </div>
      </div>

      {feedback.toneAndStyle && (
        <Category title="Tone & Style" score={feedback.toneAndStyle.score || 0} />
      )}
      {feedback.content && (
        <Category title="Content" score={feedback.content.score || 0} />
      )}
      {feedback.structure && (
        <Category title="Structure" score={feedback.structure.score || 0} />
      )}
      {feedback.skills && (
        <Category title="Skills" score={feedback.skills.score || 0} />
      )}
    </div>
  );
};

export default Summary;

