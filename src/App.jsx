import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import ResourcesGrid from './components/ResourcesGrid'
import LearningShowcase from './components/LearningShowcase'
import LearnersMarquee from './components/LearnersMarquee'
import CommunityStats from './components/CommunityStats'
import Footer from './components/Footer'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Signin from './components/Signin'
import Signup from './components/Signup'

const AppContent = () => {
  const { darkMode } = useTheme();
  const [showSignin, setShowSignin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  
  // Apply theme class to document element for global styling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-black'} w-screen min-h-screen transition-colors duration-300 pt-16`}>
      <Navbar onLoginClick={() => setShowSignin(true)} />
      <HeroSection />
      <LearnersMarquee />
      <ResourcesGrid />
      <LearningShowcase />
      <CommunityStats />
      <Footer />

      {showSignin && (
        <Signin
          isOpen={showSignin}
          onClose={() => setShowSignin(false)}
          openSignup={() => { setShowSignin(false); setShowSignup(true); }}
        />
      )}
      {showSignup && (
        <Signup
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          openSignin={() => { setShowSignup(false); setShowSignin(true); }}
        />
      )}
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