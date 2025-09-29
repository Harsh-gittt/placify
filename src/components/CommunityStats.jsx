import React from 'react'

function Stat({ value, label, icon }) {
  return (
    <div className="rounded-3xl p-6 bg-gradient-to-b from-[#ece7e3]/20 to-[#000]/20 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
      <div className="w-64 h-64 mx-auto rounded-2xl bg-black flex flex-col items-center justify-center gap-3">
        <div className="text-4xl">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  )
}

function CommunityStats() {
  const stats = [
    { value: '800K+', label: 'Youtube' },
    { value: '160K+', label: 'Twitter' },
    { value: '210K+', label: 'Instagram' },
    { value: '750K+', label: 'LinkedIn' },
  ]

  return (
    <section className="bg-black text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-extrabold text-center mb-12">Join Our Ever–Growing Global Community</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <Stat key={idx} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default CommunityStats


