export function formatSize(bytes) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const generateUUID = () =>
  crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

export const prepareInstructions = ({
  jobTitle = "",
  jobDescription = "",
  resumeText = "",
} = {}) => {
  const AIResponseFormat = `interface Feedback { overallScore: number; ATS: { score: number; tips: { type: \"good\" | \"improve\"; tip: string; }[]; }; toneAndStyle: { score: number; tips: { type: \"good\" | \"improve\"; tip: string; explanation: string; }[]; }; content: { score: number; tips: { type: \"good\" | \"improve\"; tip: string; explanation: string; }[]; }; structure: { score: number; tips: { type: \"good\" | \"improve\"; tip: string; explanation: string; }[]; }; skills: { score: number; tips: { type: \"good\" | \"improve\"; tip: string; explanation: string; }[]; }; }`;

  return `You are an expert in ATS (Applicant Tracking System) and resume analysis.
      Please analyze and rate this resume and suggest how to improve it.
      
      IMPORTANT: All scores must be on a scale of 0 to 100 (not 0-10 or percentages).
      - overallScore: A number between 0 and 100
      - ATS.score: A number between 0 and 100
      - toneAndStyle.score: A number between 0 and 100
      - content.score: A number between 0 and 100
      - structure.score: A number between 0 and 100
      - skills.score: A number between 0 and 100
      
      Example: If a resume is decent, give it a score of 65 (not 6.5 or 0.65).
      Example: If a resume is excellent, give it a score of 85-95.
      Example: If a resume is poor, give it a score of 20-40.
      
      The rating can be low if the resume is bad, but use the full 0-100 scale.
      Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
      If available, use the job description for the job user is applying to to give more detailed feedback.
      The job title is: ${jobTitle}
      The job description is: ${jobDescription}
      The resume content is:
      ${resumeText}
      Provide the feedback using the following format:
      ${AIResponseFormat}
      Return the analysis as an JSON object, without any other text and without the backticks.
      Do not include any other text or comments.`;
};

// Normalize scores to ensure they're on a 0-100 scale
export const normalizeScore = (score) => {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  
  // Handle negative scores
  if (score < 0) return 0;
  
  // If score is less than 1 (but greater than 0), assume it's a percentage (0-1) and multiply by 100
  // Example: 0.65 becomes 65
  if (score < 1 && score > 0) {
    return Math.round(score * 100);
  }
  
  // If score is between 1 and 10 (inclusive), assume it's on a 0-10 scale and multiply by 10
  // Example: 6.5 becomes 65, 10 becomes 100
  if (score >= 1 && score <= 10) {
    return Math.round(score * 10);
  }
  
  // If score is already on 0-100 scale, ensure it's within bounds
  if (score > 100) return 100;
  
  // If score is between 10 and 100, assume it's already correct
  return Math.round(score);
};

// Normalize all scores in feedback object
export const normalizeFeedback = (feedback) => {
  if (!feedback || typeof feedback !== 'object') return feedback;
  
  const normalized = { ...feedback };
  
  // Normalize overallScore
  if (typeof normalized.overallScore === 'number') {
    normalized.overallScore = normalizeScore(normalized.overallScore);
  }
  
  // Normalize ATS score
  if (normalized.ATS && typeof normalized.ATS.score === 'number') {
    normalized.ATS.score = normalizeScore(normalized.ATS.score);
  }
  
  // Normalize category scores
  const categories = ['toneAndStyle', 'content', 'structure', 'skills'];
  categories.forEach(category => {
    if (normalized[category] && typeof normalized[category].score === 'number') {
      normalized[category].score = normalizeScore(normalized[category].score);
    }
  });
  
  return normalized;
};
