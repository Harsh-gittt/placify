import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import usePuterStore from "../../lib/puter";
import ScoreCircle from "./ScoreCircle";

const ResumeCard = ({ resume }) => {
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
      className="resume-card animate-in fade-in duration-1000 block"
    >
      <div className="resume-card-header flex items-start justify-between">
        <div className="flex flex-col gap-2">
          {companyName ? (
            <h2 className="!text-black font-bold break-words">{companyName}</h2>
          ) : (
            <h2 className="!text-black font-bold">Resume</h2>
          )}
          {jobTitle && (
            <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
          )}
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback?.overallScore || 0} />
        </div>
      </div>
      {resumeUrl && (
        <div className="gradient-border mt-4">
          <div className="w-full h-full">
            <img
              src={resumeUrl}
              alt="resume"
              className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
            />
          </div>
        </div>
      )}
    </Link>
  );
};

export default ResumeCard;
