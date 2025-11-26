import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import FileUploader from "./FileUploader";
import { convertPdfToImage, extractTextFromPdf } from "../../lib/pdf2img";
import { generateUUID, prepareInstructions, normalizeFeedback } from "../../lib/utils";
import { fetchAIResponse } from "../../lib/puterClient";

const Upload = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = (f) => {
    setFile(f);
    setError("");
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }) => {
    try {
      setIsProcessing(true);
      setError("");
      setStatusText("Processing...");

      // You can add file upload logic here if needed

      setStatusText("Converting PDF to image...");
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        setError("Failed to convert PDF to image. Please upload a valid PDF.");
        setIsProcessing(false);
        return;
      }

      setStatusText("Analyzing resume with AI...");
      
      // Extract text from PDF
      const resumeText = await extractTextFromPdf(file);
      
      // Prepare the AI prompt
      const prompt = prepareInstructions({ jobTitle, jobDescription, resumeText });

      // Call anonymous AI—no Puter signin required!
      const feedbackRaw = await fetchAIResponse(prompt);

      let feedbackText = feedbackRaw;
      let data = {};
      try {
        data = JSON.parse(feedbackText);
        data.feedback = normalizeFeedback(data);
      } catch (e) {
        data.feedback = {
          overallScore: 0,
          ATS: { score: 0, tips: [] },
          toneAndStyle: { score: 0, tips: [] },
          content: { score: 0, tips: [] },
          structure: { score: 0, tips: [] },
          skills: { score: 0, tips: [] }
        };
      }

      setStatusText("Analysis complete, redirecting...");
      // Simulate saving and redirect after a second
      setTimeout(() => {
        // Optionally persist feedback, then route
        navigate(`/resume/preview`, { 
          state: { 
            data: {
              ...data,
              resumeUrl: URL.createObjectURL(file),
              imageUrl: imageFile.imageUrl
            }
          } 
        });
      }, 800);

    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name") || "";
    const jobTitle = formData.get("job-title") || "";
    const jobDescription = formData.get("job-description") || "";
    if (!file) return;
    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className={`${darkMode ? 'bg-[#0a0a0a]' : 'bg-[url(\'/images/bg-main.svg\')]'} bg-cover min-h-screen transition-colors duration-300`}>
      <section className="main-section">
        <div className="page-heading py-16 max-md:py-8 max-sm:py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className={`max-md:text-4xl max-sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Smart feedback for your dream job
          </h1>
          {isProcessing ? (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
              <h2 className={`max-md:text-xl max-sm:text-lg mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{statusText}</h2>
              
              <div className="relative w-64 h-80 bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
                {/* Document lines */}
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-2 pt-4">
                    <div className="h-2 bg-gray-100 rounded"></div>
                    <div className="h-2 bg-gray-100 rounded"></div>
                    <div className="h-2 bg-gray-100 rounded"></div>
                    <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <div className="h-2 bg-gray-100 rounded"></div>
                    <div className="h-2 bg-gray-100 rounded"></div>
                    <div className="h-2 bg-gray-100 rounded w-4/5"></div>
                  </div>
                </div>
                
                {/* Scanning line */}
                <div className="absolute left-0 w-full h-1 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-scan z-10"></div>
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none"></div>
              </div>
            </div>
          ) : (
            <h2 className={`max-md:text-xl max-sm:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Drop your resume for an ATS score and improvement tips
            </h2>
          )}

          {error && (
            <div className={`mt-4 p-4 rounded-lg max-w-2xl mx-auto border animate-in slide-in-from-top-4 duration-500 ${
              darkMode ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          <form
            id="upload-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 mt-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150"
          >
            <div className="form-div">
              <label htmlFor="company-name" className={`max-sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Company Name
              </label>
              <input
                type="text"
                name="company-name"
                placeholder="Company Name (Optional)"
                id="company-name"
                className={`max-sm:text-sm max-sm:p-3 transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#121212] border-gray-700 text-white placeholder-gray-500 focus:border-orange-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400'
                }`}
              />
            </div>
            <div className="form-div">
              <label htmlFor="job-title" className={`max-sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Job Title
              </label>
              <input
                type="text"
                name="job-title"
                placeholder="Job Title (Optional)"
                id="job-title"
                className={`max-sm:text-sm max-sm:p-3 transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#121212] border-gray-700 text-white placeholder-gray-500 focus:border-orange-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400'
                }`}
              />
            </div>
            <div className="form-div">
              <label htmlFor="job-description" className={`max-sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Job Description
              </label>
              <textarea
                rows={5}
                name="job-description"
                placeholder="Job Description (Optional - helps provide better feedback)"
                id="job-description"
                className={`max-sm:text-sm max-sm:p-3 transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#121212] border-gray-700 text-white placeholder-gray-500 focus:border-orange-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400'
                }`}
              />
            </div>

            <div className="form-div">
              <label htmlFor="uploader" className={`max-sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Upload Resume (PDF)
              </label>
              <FileUploader onFileSelect={handleFileSelect} />
            </div>

            <button 
              className={`max-sm:text-base max-sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                darkMode 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
              } font-semibold px-6 py-3 rounded-xl`}
              type="submit"
              disabled={!file || isProcessing}
            >
              {!file ? "Please select a file" : "Analyze Resume"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Upload;
