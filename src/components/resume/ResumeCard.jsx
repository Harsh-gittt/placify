import React from "react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ScoreCircle from "./ScoreCircle";

const ResumeCard = ({ resume }) => {
  const { darkMode } = useTheme();
  const { id, companyName, jobTitle, feedback, imagePath } = resume || {};
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    const loadResume = async () => {
      if (!imagePath) return;
      // Assuming imagePath is a URL or path to an image on the backend
      // For now, we'll just set the URL directly if it's a path
      // In a real scenario, you'd fetch the image from the backend
      setResumeUrl(imagePath);
    };
    loadResume();
  }, [imagePath]);

  return (
    <Link
      to={`