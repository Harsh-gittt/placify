import React from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import CardBlock from './components/CardBlock'

function App() {
  return (
    <div className='bg-black text-white w-screen h-screen'>
      <Navbar />
      <HeroSection />

      <div className="bg-black flex items-center justify-center gap-10 py-3 px-5">
        <CardBlock
          title="DSA"
          description="Master essential data structures & algorithms for efficient problem-solving skills."
          buttonText="Explore"
          
        />

        <CardBlock
          title="STUDY PARTNER"
          description="Connect with peers, collaborate, and study together for better learning."
          buttonText="Explore"
          
        />

        <CardBlock
          title="INTERNSHIPS"
          description="Find top internship opportunities to gain real-world experience and grow."
          buttonText="Explore"
          
        />

        <CardBlock
          title="RESOURCES"
          description="Access curated articles, tutorials, and tools for placement preparation."
          buttonText="Explore"
          
        />
    </div>
    </div>
  )
}

export default App