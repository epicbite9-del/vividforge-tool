import React, { useState, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { useDropzone } from 'react-dropzone';
import { Download, Upload, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import Loader from '../components/Loader';

const BackgroundRemover = () => {
  const [originalUrl, setOriginalUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null); // The raw AI result (Transparent PNG)
  const [previewUrl, setPreviewUrl] = useState(null); // The final composite
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('Initializing...');
  
  // Settings
  const [bgColor, setBgColor] = useState('transparent');
  const [erodeLevel, setErodeLevel] = useState(0); // 0 to 10
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Process with AI
  const processImage = async (file) => {
    if (!file) return;
    setLoading(true);
    setProcessedUrl(null);
    setPreviewUrl(null);
    setProgress('Loading AI Model...');
    
    const localUrl = URL.createObjectURL(file);
    setOriginalUrl(localUrl);

    try {
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const percent = Math.round((current / total) * 100);
          setProgress(`Processing: ${percent}%`);
        },
        output: { format: 'image/png', quality: 1.0 }
      });

      const url = URL.createObjectURL(blob);
      setProcessedUrl(url); 
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert('AI Processing Failed. Please try a different image.');
    }
  };

  // ---------------------------------------------------------
  // THE NEW RENDERING ENGINE (Fixes Color Bleeding)
  // ---------------------------------------------------------
  useEffect(() => {
    if (processedUrl) {
      updateCanvas();
    }
  }, [processedUrl, bgColor, erodeLevel]);

  const updateCanvas = async () => {
    if (!processedUrl) return;

    const img = new Image();
    img.src = processedUrl;
    await new Promise(r => img.onload = r);

    // 1. Setup Main Canvas (Final Output)
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    // 2. Draw Background Layer First (Bottom Layer)
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Prepare the Subject Layer (Cutout)
    // We do this on a separate canvas to modify edges BEFORE placing on background
    const subjectCanvas = document.createElement('canvas');
    subjectCanvas.width = canvas.width;
    subjectCanvas.height = canvas.height;
    const subjectCtx = subjectCanvas.getContext('2d');

    // Draw the raw AI result (Subject)
    subjectCtx.drawImage(img, 0, 0);

    // 4. Apply Alpha Erosion (The Halo Fix)
    // We use 'destination-in' to eat away the alpha channel from the edges inward
    if (erodeLevel > 0) {
      subjectCtx.globalCompositeOperation = 'destination-in';
      
      // We loop to strictly cut 1px at a time from all directions
      for (let i = 0; i < erodeLevel; i++) {
        // We draw the image over itself shifted slightly.
        // Where the shifted image is transparent, it cuts the transparency of the main image.
        // This keeps colors intact but shrinks the "Mask".
        subjectCtx.drawImage(subjectCanvas, -1, 0); // Shift Left
        subjectCtx.drawImage(subjectCanvas, 1, 0);  // Shift Right
        subjectCtx.drawImage(subjectCanvas, 0, -1); // Shift Up
        subjectCtx.drawImage(subjectCanvas, 0, 1);  // Shift Down
      }
      
      // Reset composite operation
      subjectCtx.globalCompositeOperation = 'source-over';
    }

    // 5. Place Subject ON TOP of Background (Top Layer)
    ctx.drawImage(subjectCanvas, 0, 0);

    setPreviewUrl(canvas.toDataURL('image/png'));
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: (files) => processImage(files[0])
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 mb-2">
            Pro Background Remover
        </h1>
        <p className="text-gray-400">Clean Edges. No Color Bleeding.</p>
      </div>
      
      {!originalUrl ? (
        <div {...getRootProps()} className="border-2 border-dashed border-gray-700 bg-dark-800/50 rounded-3xl p-20 text-center cursor-pointer hover:border-pink-500 hover:bg-dark-800 transition group">
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-500 mb-4 group-hover:text-pink-500" />
          <p className="text-xl text-gray-300">Drop image here</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[350px_1fr] gap-8 items-start">
          
          {/* CONTROL PANEL */}
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 space-y-8 sticky top-24">
             
             {/* 1. Hair Fix / Erosion Slider */}
             <div>
                <div className="flex justify-between mb-2">
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                     <Sparkles size={14} className="text-yellow-400"/> Clean Edges
                   </label>
                   <span className="text-xs font-mono text-pink-400">Level {erodeLevel}</span>
                </div>
                <input 
                  type="range" min="0" max="10" step="1" 
                  value={erodeLevel}
                  onChange={(e) => setErodeLevel(parseInt(e.target.value))}
                  className="w-full accent-pink-500 h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-gray-500 mt-2">
                   Increase to remove "glow" or background noise from edges.
                </p>
             </div>

             {/* 2. Color Picker */}
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">
                    Background Color
                </label>
                
                <div className="flex flex-wrap gap-3 mb-4">
                   <button 
                     onClick={() => setBgColor('transparent')}
                     className={`w-10 h-10 rounded-full border-2 ${bgColor === 'transparent' ? 'border-pink-500' : 'border-gray-600'} bg-[url('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ft4.ftcdn.net%2Fjpg%2F02%2F07%2F87%2F79%2F360_F_207877921_BtWO6oM9kUYbHuhePi8aeodaaZef47aQ.jpg&f=1&nofb=1&ipt=06772714571cf318df283f36034190cb646736270ce79a781df034032d847683&ipo=images')] bg-cover`}
                     title="Transparent"
                   />
                   <button 
                     onClick={() => setIsPickerOpen(!isPickerOpen)}
                     className={`w-10 h-10 rounded-full border-2 border-white/20 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center`}
                     title="Custom Color Wheel"
                   >
                     <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                   </button>
                </div>

                {isPickerOpen && (
                  <div className="bg-dark-900 p-3 rounded-xl border border-white/10 animate-fade-in">
                    <HexColorPicker color={bgColor === 'transparent' ? '#ffffff' : bgColor} onChange={setBgColor} style={{ width: '100%', height: '150px' }} />
                    <div className="mt-3 text-center text-xs font-mono text-gray-400 uppercase">
                      {bgColor}
                    </div>
                  </div>
                )}
             </div>

             <hr className="border-white/10"/>

             <button 
                onClick={() => { setOriginalUrl(null); setProcessedUrl(null); }}
                className="w-full py-3 border border-gray-600 text-gray-300 hover:bg-dark-700 rounded-xl font-medium transition flex items-center justify-center gap-2"
             >
                <RefreshCw size={18} /> New Image
             </button>
          </div>

          {/* MAIN PREVIEW */}
          <div className="bg-dark-800 rounded-2xl border border-white/10 p-2 min-h-[500px] flex items-center justify-center relative overflow-hidden bg-[url('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ft4.ftcdn.net%2Fjpg%2F02%2F07%2F87%2F79%2F360_F_207877921_BtWO6oM9kUYbHuhePi8aeodaaZef47aQ.jpg&f=1&nofb=1&ipt=06772714571cf318df283f36034190cb646736270ce79a781df034032d847683&ipo=images')] bg-cover">
            
            {loading && (
                <div className="bg-dark-900/95 absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-sm px-4">
                    <Loader text={progress} />
                </div>
            )}

            <div className="relative w-full h-full flex items-center justify-center p-4">
                {previewUrl ? (
                    <img src={previewUrl} className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg" alt="Result" />
                ) : (
                    originalUrl && <img src={originalUrl} className="max-w-full max-h-[70vh] object-contain opacity-50 blur-sm" alt="Original" />
                )}
            </div>

            {previewUrl && !loading && (
                <div className="absolute bottom-6 right-6 z-30">
                    <a 
                        href={previewUrl} 
                        download="vividforge-edited.png" 
                        className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition hover:-translate-y-1"
                    >
                        <Download size={20} /> Download
                    </a>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default BackgroundRemover;
