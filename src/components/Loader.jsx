import React from 'react';

const Loader = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-brand-accent border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
    </div>
    <p className="text-gray-300 font-medium animate-pulse">{text || 'AI is processing...'}</p>
  </div>
);
export default Loader;
