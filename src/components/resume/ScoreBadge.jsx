const ScoreBadge = ({ score }) => {
  const getBadgeClasses = (score) => {
    if (score > 69) {
      return "bg-badge-green text-badge-green-text";
    } else if (score > 39) {
      return "bg-badge-yellow text-badge-yellow-text";
    } else {
      return "bg-badge-red text-badge-red-text";
    }
  };

  return (
    <div
      className={`flex flex-row gap-1 items-center px-2 py-0.5 rounded-[96px] ${getBadgeClasses(
        score
      )}`}
    >
      <img
        src={score > 69 ? "/icons/check.svg" : "/icons/warning.svg"}
        alt="score"
        className="size-4"
      />
      <p className="text-sm font-medium">{score}/100</p>
    </div>
  );
};

export default ScoreBadge;

