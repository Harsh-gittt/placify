import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import usePuterStore from "../../lib/puter";
import ScoreCircle from "./ScoreCircle";

const ResumeCard = ({ resume }) => {
  const { darkMode } = useTheme();
  const { id, companyName, jobTitle, feedback, imagePath } = resume || {};
  const { fs } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    const loadResume = async () => {
      if (!imagePath) return;
      const blob = await fs.read(imagePath);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setResumeUrl(url);
    };
    loadResume();
  }, [imagePath]);

  return (
    <Link
      to={`/resume/${id}`}
      className={`resume-card animate-in fade-in duration-1000 block transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        darkMode 
          ? 'bg-[#0a0a0a] border-gray-800 shadow-lg shadow-gray-900/50' 
          : 'bg-white shadow-md'
      } border rounded-xl`}
    >
      <div className="resume-card-header flex items-start justify-between">
        <div className="flex flex-col gap-2">
          {companyName ? (
            <h2 className={`font-bold break-words ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {companyName}
            </h2>
          ) : (
            <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Resume
            </h2>
          )}
          {jobTitle && (
            <h3 className={`text-lg break-words ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {jobTitle}
            </h3>
          )}
        </div>
        <div className="flex-shrink-0 animate-in zoom-in duration-700 delay-300">
          <ScoreCircle score={feedback?.overallScore || 0} />
        </div>
      </div>
      {resumeUrl && (
        <div className="gradient-border mt-4 hover:scale-[1.01] transition-transform duration-300">
          <div className="w-full h-full">
            <img
              src={resumeUrl}
              alt="resume"
              className="w-full h-[350px] max-sm:h-[200px] object-cover object-top rounded-lg"
            />
          </div>
        </div>
      )}
    </Link>
  );
};

export default ResumeCard;
