import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Activity, Download, RefreshCw, Layers, Droplet } from 'lucide-react';
import pica from 'pica';
import Loader from '../components/Loader';

const ImageUpscaler = () => {
  const [originalUrl, setOriginalUrl] = useState(null);
  const [finalUrl, setFinalUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Settings
  const [scaleFactor, setScaleFactor] = useState(2);
  const [clarity, setClarity] = useState(150); // Sharpness (Unblur)
  const [denoise, setDenoise] = useState(20);  // Smoothness (Noise Removal)
  
  const [sliderPosition, setSliderPosition] = useState(50);
  const [currentFile, setCurrentFile] = useState(null);
  const containerRef = useRef(null);

  // THE HYBRID ENGINE (Smooth + Sharpen)
  const processUpscale = async (file) => {
    if (!file) return;
    setLoading(true);
    setFinalUrl(null);
    setOriginalUrl(URL.createObjectURL(file));

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(r => img.onload = r);

      // 1. PRE-PROCESSING (Denoise / Smoothing)
      // We draw the original image onto a canvas with a blur filter
      // to kill noise BEFORE we upscale.
      const preCanvas = document.createElement('canvas');
      preCanvas.width = img.width;
      preCanvas.height = img.height;
      const preCtx = preCanvas.getContext('2d');

      // Smart Denoise Logic:
      // We apply a slight blur based on the 'Denoise' slider.
      // 0 = No blur, 100 = 2px blur (strong smoothing)
      if (denoise > 0) {
          preCtx.filter = `blur(${denoise * 0.02}px)`; 
      }
      preCtx.drawImage(img, 0, 0);

      // 2. UPSCALING (Lanczos3)
      const targetWidth = img.width * scaleFactor;
      const targetHeight = img.height * scaleFactor;
      
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const picaRunner = pica();
      
      // 3. POST-PROCESSING (Clarify / Unblur)
      // We increase the threshold based on Denoise level.
      // If Denoise is high, we tell the sharpener to IGNORE small grains (Threshold increases).
      const smartThreshold = 1 + (denoise * 0.5); 

      await picaRunner.resize(preCanvas, canvas, {
        unsharpAmount: clarity, // Strength of "Unblur"
        unsharpRadius: 0.6 + (scaleFactor * 0.1), // Radius adjusts with scale
        unsharpThreshold: smartThreshold // Prevents sharpening the noise we just blurred
      });

      const blob = await picaRunner.toBlob(canvas, 'image/png', 1.0);
      setFinalUrl(URL.createObjectURL(blob));
      setLoading(false);

    } catch (err) {
      console.error(err);
      alert("Error processing image.");
      setLoading(false);
    }
  };

  // Debounce processing to allow slider dragging without lag
  useEffect(() => {
    if (currentFile && !loading) {
       const timer = setTimeout(() => {
           processUpscale(currentFile);
       }, 400); // 400ms delay
       return () => clearTimeout(timer);
    }
  }, [clarity, denoise, scaleFactor]);

  const handleSliderMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: (files) => {
        setCurrentFile(files[0]);
        processUpscale(files[0]);
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600 mb-2">
            Smart Image Upscaler
        </h1>
        <p className="text-gray-400">Denoise • Unblur • Upscale</p>
      </div>

      {!originalUrl ? (
        <div className="max-w-xl mx-auto">
            <div className="flex justify-center gap-4 mb-8">
                <button onClick={() => setScaleFactor(2)} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all w-32 ${scaleFactor === 2 ? 'border-violet-500 bg-violet-500/10' : 'border-gray-700 bg-dark-800 opacity-60'}`}>
                    <span className="text-2xl font-black text-white">2x</span>
                    <span className="text-xs text-gray-400">Standard</span>
                </button>
                <button onClick={() => setScaleFactor(4)} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all w-32 ${scaleFactor === 4 ? 'border-violet-500 bg-violet-500/10' : 'border-gray-700 bg-dark-800 opacity-60'}`}>
                    <span className="text-2xl font-black text-white">4x</span>
                    <span className="text-xs text-violet-300">Ultra HD</span>
                </button>
            </div>

            <div {...getRootProps()} className="border-2 border-dashed border-gray-700 bg-dark-800/50 rounded-3xl p-20 text-center cursor-pointer hover:border-violet-500 hover:bg-dark-800 transition group">
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-500 mb-4 group-hover:text-violet-500" />
                <p className="text-xl text-gray-300">Drop image to Enhance</p>
            </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
           
           {/* CONTROLS */}
           <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 space-y-8 sticky top-24">
              
              <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl text-center">
                  <p className="text-xs text-violet-300 uppercase font-bold mb-1">Active Mode</p>
                  <p className="text-2xl font-black text-white">{scaleFactor}x Smart-Scale</p>
              </div>

              {/* SLIDER 1: CLARITY */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity size={14} className="text-blue-400"/> Unblur (Clarity)
                </label>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">Soft</span>
                    <input 
                        type="range" min="0" max="250" 
                        value={clarity}
                        onChange={(e) => setClarity(parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-white">Sharp</span>
                </div>
              </div>

              {/* SLIDER 2: DENOISE */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Droplet size={14} className="text-pink-400"/> Denoise (Smoothness)
                </label>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">Grainy</span>
                    <input 
                        type="range" min="0" max="100" 
                        value={denoise}
                        onChange={(e) => setDenoise(parseInt(e.target.value))}
                        className="w-full accent-pink-500 h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-white">Smooth</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                   Increase to remove noise and smooth skin.
                </p>
              </div>

              <hr className="border-white/10"/>

              <button 
                onClick={() => { setOriginalUrl(null); setFinalUrl(null); setCurrentFile(null); }}
                className="w-full py-3 border border-gray-600 text-gray-300 hover:bg-dark-700 rounded-xl font-medium transition flex items-center justify-center gap-2"
             >
                <RefreshCw size={18} /> Start Over
             </button>
           </div>

           {/* PREVIEW */}
           <div className="min-h-[500px] flex flex-col items-center w-full">
             
             {loading && (
                <div className="w-full h-[500px] bg-dark-800 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                    <Loader text="Processing..." />
                </div>
             )}

             {finalUrl && !loading && (
               <div className="w-full space-y-6 animate-fade-in">
                 {/* COMPARISON SLIDER */}
                 <div 
                    ref={containerRef}
                    onMouseMove={handleSliderMove}
                    onTouchMove={(e) => {
                        const touch = e.touches[0];
                        const rect = containerRef.current.getBoundingClientRect();
                        const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                        setSliderPosition((x / rect.width) * 100);
                    }}
                    className="relative w-full h-[65vh] bg-black/50 rounded-2xl overflow-hidden cursor-col-resize border border-white/10 select-none shadow-2xl"
                 >
                    {/* AFTER */}
                    <img src={finalUrl} className="absolute top-0 left-0 w-full h-full object-contain" alt="After" />
                    <div className="absolute top-4 right-4 bg-violet-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                        RESULT
                    </div>

                    {/* BEFORE */}
                    <div 
                        className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white/50 bg-black/50"
                        style={{ width: `${sliderPosition}%` }}
                    >
                        <img 
                            src={originalUrl} 
                            className="absolute top-0 left-0 w-full h-full object-contain max-w-none" 
                            style={{ width: containerRef.current?.getBoundingClientRect().width || '100%' }}
                            alt="Before" 
                        />
                        <div className="absolute top-4 left-4 bg-gray-800/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                            ORIGINAL
                        </div>
                    </div>

                    <div 
                        className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                    >
                        <div className="w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                            <Layers size={16} className="text-gray-600" />
                        </div>
                    </div>
                 </div>

                 <div className="flex justify-between items-center bg-dark-800 p-4 rounded-xl border border-white/10">
                    <div className="text-gray-400 text-sm">
                        Result: <span className="text-violet-400 font-bold">{scaleFactor}x Resolution</span>
                    </div>
                    <a 
                        href={finalUrl} 
                        download={`vividforge-${scaleFactor}x.png`}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition hover:-translate-y-1"
                    >
                        <Download size={20} /> Download Result
                    </a>
                 </div>
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};
export default ImageUpscaler;
