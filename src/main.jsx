import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BackgroundRemover from './tools/BackgroundRemover';
import ImageCompressor from './tools/ImageCompressor';
import ImageResizer from './tools/ImageResizer';
import ImageUpscaler from './tools/ImageUpscaler';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* CHANGED: bg-gray-50 -> bg-dark-900 and added text-white */}
      <div className="min-h-screen bg-dark-900 text-white flex flex-col font-sans selection:bg-brand-primary selection:text-white">
        <Navbar />
        <div className="flex-grow relative z-0">
          {/* Subtle background glow effect */}
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/10 rounded-full blur-[120px]"></div>
          </div>
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/remove-bg" element={<BackgroundRemover />} />
            <Route path="/compress" element={<ImageCompressor />} />
            <Route path="/resize" element={<ImageResizer />} />
            <Route path="/upscale" element={<ImageUpscaler />} />
          </Routes>
        </div>
        <footer className="bg-dark-900 border-t border-white/5 py-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} VividForge. 100% Client-Side Privacy.</p>
        </footer>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
);
