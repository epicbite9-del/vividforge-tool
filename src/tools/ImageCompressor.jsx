import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  Zap, 
  Minimize2, 
  ArrowRight,
  FileDigit,
  Layers,
  Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility: Tailwind Class Merger ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Utility: Format Bytes ---
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ImageCompressor = () => {
  // --- State ---
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  
  const [originalUrl, setOriginalUrl] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);

  // Settings
  const [quality, setQuality] = useState(0.8); // 0 to 1
  const [useWebP, setUseWebP] = useState(true);
  
  // UI State
  const [isCompressing, setIsCompressing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50); // % for comparison slider
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const sliderRef = useRef(null);

  // --- Handlers: File Upload ---
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalFile(file);
      setOriginalUrl(url);
      setCompressedFile(null); // Reset previous
      setCompressedUrl(null);
      // Trigger initial compression
      compressImage(file, 0.8, true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  // --- Core: Compression Logic ---
  const compressImage = async (file, q, asWebP) => {
    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 2, // Soft limit, quality takes precedence usually
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: q,
        fileType: asWebP ? 'image/webp' : undefined,
      };

      const compressedBlob = await imageCompression(file, options);
      
      // If the library returns a blob larger than original (rare but happens on tiny optimized images), use original
      // But we usually want to show the result regardless for the tool
      setCompressedFile(compressedBlob);
      
      const url = URL.createObjectURL(compressedBlob);
      setCompressedUrl(url);
    } catch (error) {
      console.error("Compression failed:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  // --- Debounced Re-compression on Settings Change ---
  useEffect(() => {
    if (!originalFile) return;

    const timer = setTimeout(() => {
      compressImage(originalFile, quality, useWebP);
    }, 500);

    return () => clearTimeout(timer);
  }, [quality, useWebP]); // Removing originalFile from dependency to avoid loop, handled by onDrop

  // --- Comparison Slider Logic ---
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, [isDragging]);

  // Touch support
  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);


  // --- Helper: Calculate Savings ---
  const getSavings = () => {
    if (!originalFile || !compressedFile) return { size: 0, percent: 0 };
    const saved = originalFile.size - compressedFile.size;
    const percent = ((saved / originalFile.size) * 100).toFixed(0);
    return { 
      size: formatBytes(saved), 
      percent: percent > 0 ? percent : 0,
      isLarger: saved < 0
    };
  };

  const savings = getSavings();

  // --- Download ---
  const handleDownload = () => {
    if (!compressedFile) return;
    const link = document.createElement('a');
    link.href = compressedUrl;
    const ext = useWebP ? 'webp' : originalFile.name.split('.').pop();
    const name = originalFile.name.split('.').slice(0, -1).join('.');
    link.download = `${name}_min.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Reset ---
  const handleReset = () => {
    setOriginalFile(null);
    setCompressedFile(null);
    setOriginalUrl(null);
    setCompressedUrl(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          Smart Image Compressor
        </h1>
        <p className="text-gray-500 mt-2 flex items-center gap-2">
          <Minimize2 size={16} className="text-emerald-400" />
          Reduce file size by up to 90% without visible quality loss.
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        {!originalFile ? (
          // --- Upload Area ---
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-3xl h-96 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group backdrop-blur-sm",
              isDragActive 
                ? "border-emerald-500 bg-emerald-500/10" 
                : "border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-white/10"
            )}
          >
            <input {...getInputProps()} />
            <div className="p-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 mb-6 shadow-lg shadow-emerald-900/50 group-hover:scale-110 transition-transform">
              <Upload size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">Drag & Drop Image</h3>
            <p className="text-gray-400">JPG, PNG, WEBP supported</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- Left Column: Controls & Stats --- */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Stats Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FileDigit size={100} className="text-white" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                   Results
                </h3>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-gray-400">Original</span>
                    <span className="text-white font-mono">{formatBytes(originalFile.size)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-emerald-400 font-semibold">Compressed</span>
                    <span className="text-emerald-400 font-mono font-bold text-xl">
                      {isCompressing ? '...' : formatBytes(compressedFile?.size)}
                    </span>
                  </div>
                </div>

                {!isCompressing && compressedFile && (
                  <div className="mt-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-center">
                    <span className="text-emerald-300 font-medium">
                      Saved {savings.size} ({savings.percent}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Controls Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Layers size={18} className="text-cyan-400" /> Compression Settings
                </h3>

                {/* Quality Slider */}
                <div className="mb-8">
                  <div className="flex justify-between mb-3">
                    <label className="text-gray-400 text-sm">Aggressiveness</label>
                    <span className="text-cyan-400 text-sm font-bold">{Math.round((1 - quality) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    style={{ direction: 'rtl' }} // High quality (1.0) on left, Low (0.1) on right? Or standard: 1.0 is max quality
                    // Standard: Right is Max Quality. If we want "Aggressiveness", Left should be low aggression (High Quality).
                    // Let's keep standard: Left (0.1) = Low Quality/High Compression. Right (1.0) = High Quality.
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Max Compression</span>
                    <span>Best Quality</span>
                  </div>
                </div>

                {/* WebP Toggle */}
                <div 
                  onClick={() => setUseWebP(!useWebP)}
                  className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 cursor-pointer hover:bg-black/40 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-medium">Convert to WebP</span>
                    <span className="text-xs text-gray-500">Modern format, smaller size</span>
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative transition-colors duration-300",
                    useWebP ? "bg-emerald-500" : "bg-gray-700"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md",
                      useWebP ? "left-7" : "left-1"
                    )} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDownload}
                  disabled={isCompressing || !compressedFile}
                  className={cn(
                    "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-lg",
                    isCompressing
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/50 hover:scale-[1.02]"
                  )}
                >
                  {isCompressing ? (
                    <RefreshCw className="animate-spin" /> 
                  ) : (
                    <Download size={20} />
                  )}
                  {isCompressing ? "Compressing..." : "Download Compressed"}
                </button>
                <button 
                  onClick={handleReset}
                  className="text-gray-500 hover:text-white text-sm py-2"
                >
                  Compress Another Image
                </button>
              </div>

            </div>

            {/* --- Right Column: Comparison Preview --- */}
            <div className="lg:col-span-8">
              <div className="h-full min-h-[500px] bg-[#050505] border border-white/10 rounded-2xl p-4 flex flex-col relative">
                
                {/* Labels */}
                <div className="absolute top-6 left-6 z-20 pointer-events-none">
                   <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-md border border-white/10 text-xs text-white font-bold">
                      ORIGINAL
                   </div>
                </div>
                <div className="absolute top-6 right-6 z-20 pointer-events-none">
                   <div className="bg-emerald-500/80 backdrop-blur px-3 py-1 rounded-md border border-white/10 text-xs text-white font-bold shadow-lg shadow-emerald-900/50">
                      COMPRESSED
                   </div>
                </div>

                {/* Comparison Container */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden select-none" ref={sliderRef}>
                   
                   {/* Background Checkerboard */}
                   <div className="absolute inset-0 z-0 opacity-20" 
                       style={{
                         backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%), 
                                           linear-gradient(-45deg, #333 25%, transparent 25%), 
                                           linear-gradient(45deg, transparent 75%, #333 75%), 
                                           linear-gradient(-45deg, transparent 75%, #333 75%)`,
                         backgroundSize: '20px 20px',
                         backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                       }}>
                   </div>

                   {/* Image Wrapper */}
                   <div 
                    className="relative max-w-full max-h-[75vh] w-auto h-auto shadow-2xl"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                   >
                      {/* Original Image (Background Layer) */}
                      <img 
                        src={originalUrl} 
                        alt="Original" 
                        className="max-w-full max-h-[75vh] block object-contain pointer-events-none"
                      />

                      {/* Compressed Image (Foreground Layer - Clipped) */}
                      {compressedUrl && !isCompressing && (
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                        >
                          <img 
                            src={compressedUrl} 
                            alt="Compressed" 
                            className="max-w-full max-h-[75vh] block object-contain w-full h-full pointer-events-none"
                          />
                        </div>
                      )}

                      {/* Slider Handle */}
                      {!isCompressing && compressedUrl && (
                        <div 
                          className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                          style={{ left: `${sliderPosition}%` }}
                        >
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-emerald-600">
                              <Zap size={16} fill="currentColor" />
                           </div>
                        </div>
                      )}

                      {/* Loading Overlay */}
                      {isCompressing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
                          <RefreshCw className="animate-spin text-emerald-400 w-12 h-12" />
                        </div>
                      )}
                   </div>
                </div>

                {/* Instructions */}
                <div className="text-center text-xs text-gray-500 mt-2">
                   Drag the slider to compare quality details
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ImageCompressor;
