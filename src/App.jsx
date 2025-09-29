import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import ResourcesGrid from './components/ResourcesGrid'
import LearningShowcase from './components/LearningShowcase'
import LearnersMarquee from './components/LearnersMarquee'
import CommunityStats from './components/CommunityStats'
import Footer from './components/Footer'
import { ThemeProvider, useTheme } from './context/ThemeContext'

const AppContent = () => {
  const { darkMode } = useTheme();
  
  // Apply theme class to document element for global styling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-black'} w-screen min-h-screen transition-colors duration-300`}>
      <Navbar />
      <HeroSection />
      <LearnersMarquee />
      <ResourcesGrid />
      <LearningShowcase />
      <CommunityStats />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App