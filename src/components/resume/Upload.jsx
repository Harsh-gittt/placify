import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUploader from "./FileUploader";
import usePuterStore from "../../lib/puter";
import { convertPdfToImage } from "../../lib/pdf2img";
import { generateUUID, prepareInstructions, normalizeFeedback } from "../../lib/utils";

import { PuterInit } from "./PuterInit";

const Upload = () => {
  const { fs, ai, kv, puterReady, error: puterError, isLoading: puterLoading } = usePuterStore();
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
      setStatusText("Initializing...");

      // Check if Puter is ready
      if (!puterReady) {
        setError("Puter.js is not ready. Please wait a moment and try again.");
        setIsProcessing(false);
        return;
      }

      if (puterError) {
        setError(`Error: ${puterError}`);
        setIsProcessing(false);
        return;
      }

      setStatusText("Uploading the file...");
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        setError("Failed to upload file. Please make sure you're signed in with Puter.");
        setIsProcessing(false);
        return;
      }

      setStatusText("Converting to image...");
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        setError("Failed to convert PDF to image. Please check if the file is a valid PDF.");
        setIsProcessing(false);
        return;
      }

      setStatusText("Uploading the image...");
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) {
        setError("Failed to upload image. Please try again.");
        setIsProcessing(false);
        return;
      }

      setStatusText("Preparing data...");
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: {},
      };
      
      const kvResult = await kv.set(`resume:${uuid}`, JSON.stringify(data));
      if (!kvResult) {
        setError("Failed to save resume data. Please try again.");
        setIsProcessing(false);
        return;
      }

      setStatusText("Analyzing resume with AI...");
      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription })
      );
      if (!feedback) {
        setError("Failed to analyze resume. Please try again.");
        setIsProcessing(false);
        return;
      }

      const feedbackText =
        typeof feedback.message?.content === "string"
          ? feedback.message.content
          : feedback.message?.content?.[0]?.text || "";
      
      try {
        const parsedFeedback = JSON.parse(feedbackText);
        // Normalize scores to ensure they're on 0-100 scale
        data.feedback = normalizeFeedback(parsedFeedback);
        console.log("Normalized feedback scores:", data.feedback);
      } catch (e) {
        console.error("Failed to parse feedback:", e);
        console.error("Raw feedback text:", feedbackText);
        data.feedback = { 
          overallScore: 0,
          ATS: { score: 0, tips: [] },
          toneAndStyle: { score: 0, tips: [] },
          content: { score: 0, tips: [] },
          structure: { score: 0, tips: [] },
          skills: { score: 0, tips: [] }
        };
      }
      
      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      setStatusText("Analysis complete, redirecting...");
      setTimeout(() => {
        navigate(`/resume/${uuid}`);
      }, 500);
    } catch (err) {
      console.error("Error in handleAnalyze:", err);
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
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <PuterInit />
      <section className="main-section">
        <div className="page-heading py-16 max-md:py-8 max-sm:py-6">
          <h1 className="max-md:text-4xl max-sm:text-3xl">Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2 className="max-md:text-xl max-sm:text-lg">{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                className="w-full max-w-md mx-auto mt-4"
                alt="processing"
              />
            </>
          ) : (
            <h2 className="max-md:text-xl max-sm:text-lg">Drop your resume for an ATS score and improvement tips</h2>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!puterReady && !puterLoading && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-yellow-700 text-sm">
                Puter.js is not ready. Please refresh the page or wait a moment.
              </p>
            </div>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8 max-w-2xl mx-auto w-full"
            >
              <div className="form-div">
                <label htmlFor="company-name" className="max-sm:text-sm">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name (Optional)"
                  id="company-name"
                  className="max-sm:text-sm max-sm:p-3"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title" className="max-sm:text-sm">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title (Optional)"
                  id="job-title"
                  className="max-sm:text-sm max-sm:p-3"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description" className="max-sm:text-sm">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description (Optional - helps provide better feedback)"
                  id="job-description"
                  className="max-sm:text-sm max-sm:p-3"
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader" className="max-sm:text-sm">Upload Resume (PDF)</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button 
                className="primary-button max-sm:text-base max-sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={!puterReady || !file || isProcessing}
              >
                {!puterReady ? "Initializing..." : !file ? "Please select a file" : "Analyze Resume"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
