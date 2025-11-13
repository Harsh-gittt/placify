import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { normalizeFeedback } from "../../lib/utils";
import Summary from "./Summary";
import ATS from "./ATS";
import Details from "./Details";

const ResumeView = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const { id } = useParams();
  const [resumeUrl, setResumeUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [feedback, setFeedback] = useState(null);
  const initialData = useMemo(() => location.state?.data || null, [location.state]);

  useEffect(() => {
    if (!initialData) return;
    if (initialData.feedback) {
      setFeedback(normalizeFeedback(initialData.feedback));
    }
    if (initialData.resumeUrl) setResumeUrl(initialData.resumeUrl);
    if (initialData.imageUrl) setImageUrl(initialData.imageUrl);
  }, [initialData]);

  useEffect(() => {
    let cancelled = false;
    const loadResume = async () => {
      if (!id) return;
      const puter = window?.puter;
      if (!puter?.kv || !puter?.fs) return;

      try {
        if (typeof puter.ready === "function") {
          await puter.ready();
        } else if (puter.ready && typeof puter.ready.then === "function") {
          await puter.ready;
        }
      } catch {
        // ignore readiness error
      }

      try {
        const resumeRaw = await puter.kv.get(`resume:${id}`);
        if (!resumeRaw) return;
        const data = JSON.parse(resumeRaw);
        const normalizedFeedback = data.feedback ? normalizeFeedback(data.feedback) : null;
        if (!cancelled && normalizedFeedback) setFeedback(normalizedFeedback);

        if (data.resumePath) {
          const blob = await puter.fs.read(data.resumePath);
          if (!cancelled && blob) {
            const pdfBlob = blob instanceof Blob ? blob : new Blob([blob], { type: "application/pdf" });
            setResumeUrl(URL.createObjectURL(pdfBlob));
          }
        }

        if (data.imagePath) {
          const imgBlob = await puter.fs.read(data.imagePath);
          if (!cancelled && imgBlob) {
            const imageBlob = imgBlob instanceof Blob ? imgBlob : new Blob([imgBlob]);
            setImageUrl(URL.createObjectURL(imageBlob));
          }
        }
      } catch (err) {
        console.error("Failed to load resume from Puter:", err);
      }
    };

    loadResume();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id && !initialData) return <div>No resume id provided</div>;

  return (
    <main className={`!pt-0 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <nav className={`resume-nav transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'}`}>
        <Link 
          to="/" 
          className={`back-button transition-all duration-200 hover:scale-105 ${
            darkMode 
              ? 'bg-[#121212] border-gray-700 hover:bg-[#1a1a1a] text-gray-300' 
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
          }`}
        >
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
            Back to Homepage
          </span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className={`feedback-section transition-colors duration-300 ${
          darkMode
            ? 'bg-[#121212]'
            : 'bg-[url(\'/images/bg-small.svg\')]'
        } bg-cover h-[100vh] max-lg:h-auto max-lg:min-h-[400px] sticky top-0 max-lg:relative flex items-center justify-center overflow-y-auto max-lg:overflow-visible`}>
          {imageUrl && resumeUrl ? (
            <div className="animate-in fade-in zoom-in duration-1000 gradient-border max-sm:m-2 m-4 h-[90%] max-lg:h-auto max-wxl:h-fit w-fit max-w-full hover:scale-105 transition-transform duration-300">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={imageUrl}
                  className="w-full h-full max-lg:max-h-[500px] object-contain rounded-2xl shadow-2xl"
                  title="resume"
                  alt="Resume preview"
                />
              </a>
            </div>
          ) : resumeUrl ? (
            <div className="w-full h-[500px] max-w-2xl mx-auto animate-in fade-in zoom-in duration-1000">
              <embed
                src={resumeUrl}
                type="application/pdf"
                className="w-full h-full min-h-[400px] rounded-xl border shadow"
                title="PDF Resume Preview"
              />
              <div className="text-xs text-center mt-2 opacity-70">(Scroll, zoom, or <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">open PDF</a>)</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-sm opacity-70 p-8">
              <span>No resume preview available.</span>
            </div>
          )}
        </section>
        <section className="feedback-section max-lg:px-4">
          <h2 className={`text-4xl max-md:text-2xl max-sm:text-xl font-bold mb-4 animate-in fade-in slide-in-from-top-4 duration-700 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
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
            <div className="animate-pulse">
              <img
                src="/images/resume-scan-2.gif"
                className="w-full max-w-md mx-auto"
                alt="Loading resume analysis"
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ResumeView;
