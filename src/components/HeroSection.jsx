import React from 'react'
import HeroImage from '../assets/images/hero section image.png'

function HeroSection() {
  return (
    <section className="bg-black text-white py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        
        {/* Text Content */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-6xl font-extrabold">
            <span className="block underline decoration-purple-700">PLACIFY</span> <br/>
            <span className="block text-purple-700 font-semibold text-3xl">YOUR PATH TO PLACEMENT & INTERNSHIPS</span>
          </h1>
          <p className="text-gray-300">
            Unlock your career potential. Access placement resources and direct links to internships and jobs.
          </p>
          <div className="space-x-4">
            <button className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-xl cursor-pointer">
              New User
            </button>
            <button className="border border-white text-white px-6 py-2 rounded-xl hover:bg-white hover:text-black cursor-pointer">
              Existing User
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
          <img src={HeroImage} alt="Placify Hero" className="w-full max-w-md object-contain" />
        </div>

      </div>
    </section>
  )
}

export default HeroSection
