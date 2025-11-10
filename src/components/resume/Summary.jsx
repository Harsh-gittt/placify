import ScoreGauge from "./ScoreGauge";
import ScoreBadge from "./ScoreBadge";

const Category = ({ title, score }) => {
  const textColor =
    score > 70 ? "text-green-600" : score > 49 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="resume-summary">
      <div className="category">
        <div className="flex flex-row max-sm:flex-col max-sm:items-start gap-2 items-center justify-center max-sm:justify-start">
          <p className="text-2xl max-md:text-xl max-sm:text-lg">{title}</p>
          <ScoreBadge score={score} />
        </div>
        <p className="text-2xl max-md:text-xl max-sm:text-lg">
          <span className={textColor}>{score}</span>/100
        </p>
      </div>
    </div>
  );
};

const Summary = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md w-full p-4 max-sm:p-3">
      <div className="flex flex-row max-md:flex-col max-md:items-center items-center p-4 max-sm:p-2 gap-8 max-md:gap-4">
        <ScoreGauge score={feedback.overallScore || 0} />

        <div className="flex flex-col gap-2 max-md:text-center">
          <h2 className="text-2xl max-md:text-xl max-sm:text-lg font-bold">
            Your Resume Score
          </h2>
          <p className="text-sm text-gray-500">
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

