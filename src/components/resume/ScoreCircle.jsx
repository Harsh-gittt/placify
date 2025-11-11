import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

const ScoreCircle = ({ score = 75 }) => {
  const { darkMode } = useTheme();
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    let startTime = null;
    const duration = 1500;
    const startScore = 0;
    const endScore = score;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(startScore + (endScore - startScore) * easeOutCubic));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="relative w-[100px] h-[100px]">
      <svg
        height="100%"
        width="100%"
        viewBox="0 0 100 100"
        className="transform -rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          stroke={darkMode ? "#374151" : "#e5e7eb"}
          strokeWidth={stroke}
          fill="transparent"
        />
        <defs>
          <linearGradient id={`grad-${score}`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF97AD" />
            <stop offset="100%" stopColor="#5171FF" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          stroke={`url(#grad-${score})`}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-semibold text-sm transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {`${animatedScore}/100`}
        </span>
      </div>
    </div>
  );
};

export default ScoreCircle;
