import React from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import ResourcesGrid from './components/ResourcesGrid'
import LearningShowcase from './components/LearningShowcase'
import LearnersMarquee from './components/LearnersMarquee'
import CommunityStats from './components/CommunityStats'
import Footer from './components/Footer'

function App() {
  return (
    <div className='bg-black text-white w-screen min-h-screen'>
      <Navbar />
      <HeroSection />
      <LearnersMarquee />
      <ResourcesGrid />
      <LearningShowcase />
      <CommunityStats />
      <Footer />
    </div>
  )
}

export default App