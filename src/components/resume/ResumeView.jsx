import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import usePuterStore from "../../lib/puter";
import { PuterInit } from "./PuterInit";
import Summary from "./Summary";
import ATS from "./ATS";
import Details from "./Details";
import { normalizeFeedback } from "../../lib/utils";

const ResumeView = () => {
  const { id } = useParams();
  const { kv, fs } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const loadResume = async () => {
      const resumeRaw = await kv.get(`resume:${id}`);
      if (!resumeRaw) return;
      const data = JSON.parse(resumeRaw);
      // Normalize scores for existing resumes (in case they were saved with wrong scale)
      const normalizedFeedback = data.feedback ? normalizeFeedback(data.feedback) : null;
      setFeedback(normalizedFeedback);

      if (data.resumePath) {
        const blob = await fs.read(data.resumePath);
        if (blob) {
          const pdfBlob = new Blob([blob], { type: "application/pdf" });
          setResumeUrl(URL.createObjectURL(pdfBlob));
        }
      }

      if (data.imagePath) {
        const imgBlob = await fs.read(data.imagePath);
        if (imgBlob) setImageUrl(URL.createObjectURL(imgBlob));
      }
    };

    loadResume();
  }, [id, kv, fs]);

  if (!id) return <div>No resume id provided</div>;

  return (
    <main className="!pt-0 min-h-screen">
      <PuterInit />
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] max-lg:h-auto max-lg:min-h-[400px] sticky top-0 max-lg:relative flex items-center justify-center overflow-y-auto max-lg:overflow-visible">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-2 m-4 h-[90%] max-lg:h-auto max-wxl:h-fit w-fit max-w-full">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={imageUrl}
                  className="w-full h-full max-lg:max-h-[500px] object-contain rounded-2xl"
                  title="resume"
                  alt="Resume preview"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section max-lg:px-4">
          <h2 className="text-4xl max-md:text-2xl max-sm:text-xl !text-black font-bold mb-4">
            Resume Review
          </h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS?.score || 0}
                suggestions={feedback.ATS?.tips || []}
              />
              <Details feedback={feedback} />
            </div>
          ) : (
            <img
              src="/images/resume-scan-2.gif"
              className="w-full max-w-md mx-auto"
              alt="Loading resume analysis"
            />
          )}
        </section>
      </div>
    </main>
  );
};

export default ResumeView;
