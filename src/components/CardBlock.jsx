import React from 'react'

function CardBlock({ title, description, buttonText, onButtonClick }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-transparent hover:border-purple-700 rounded-xl p-6 w-2/10 h-50 flex flex-col justify-between shadow-lg">
      
      {/* Title */}
      <h2 className="text-white text-xl font-bold">
        {title}
      </h2>

      {/* Description */}
      <p className="text-gray-300 text-xs mt-4 flex-grow overflow-auto">
        {description}
      </p>

      {/* Explore Button */}
      <button
        onClick={onButtonClick}
        className="bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl hover:bg-purple-800 mt-6 cursor-pointer"
      >
        {buttonText}
      </button>

    </div>
  )
}

export default CardBlock
