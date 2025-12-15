import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import pica from 'pica';
import { 
  Upload, 
  Download, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Image as ImageIcon, 
  Sliders, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility: Tailwind Class Merger ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Utility: Format Bytes ---
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ImageResizer = () => {
  // --- State ---
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  // Resizing State
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [lockRatio, setLockRatio] = useState(true);
  
  // Output State
  const [format, setFormat] = useState('jpeg'); // jpeg, png, webp
  const [quality, setQuality] = useState(90);   // 0-100
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [estimatedSize, setEstimatedSize] = useState(0);

  // Refs
  const canvasRef = useRef(null);

  // --- Handlers: File Upload ---
  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      const objectUrl = URL.createObjectURL(uploadedFile);
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setAspectRatio(img.naturalWidth / img.naturalHeight);
        setFile(uploadedFile);
        setPreviewUrl(objectUrl);
      };
      img.src = objectUrl;
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  // --- Handlers: Dimensions ---
  const handleWidthChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setWidth(val);
    if (lockRatio && val > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setHeight(val);
    if (lockRatio && val > 0) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  // --- Engine: Pica Resize (Debounced) ---
  useEffect(() => {
    if (!file || !width || !height) return;

    // Debounce to prevent processing on every keystroke
    const timer = setTimeout(async () => {
      setIsProcessing(true);

      try {
        const picaInstance = pica();
        const img = new Image();
        img.src = previewUrl;
        await img.decode(); // Ensure image is loaded

        // Create off-screen canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // 1. Resize (Lanczos3 is default in Pica)
        // unsharpAmount: adds slight sharpness to combat resizing blur
        await picaInstance.resize(img, canvas, {
          unsharpAmount: 80,
          unsharpRadius: 0.6,
          unsharpThreshold: 2
        });

        // 2. Convert to Blob
        // Pica toBlob is faster and offloads to web workers where possible
        const mimeType = `image/${format}`;
        const finalQuality = format === 'png' ? undefined : quality / 100; // PNG is lossless

        const blob = await picaInstance.toBlob(canvas, mimeType, finalQuality);
        
        setProcessedBlob(blob);
        setEstimatedSize(blob.size);
      } catch (error) {
        console.error("Resizing error:", error);
      } finally {
        setIsProcessing(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [width, height, format, quality, file, previewUrl]);

  // --- Handler: Download ---
  const handleDownload = () => {
    if (!processedBlob) return;
    const url = URL.createObjectURL(processedBlob);
    const link = document.createElement('a');
    link.href = url;
    const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
    link.download = `${nameWithoutExt}_vividforge.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Reset ---
  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setProcessedBlob(null);
    setWidth(0);
    setHeight(0);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12 font-sans selection:bg-violet-500/30">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
            Pro Image Resizer
          </h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            Powered by Lanczos3 High-Quality Algorithm
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {!file ? (
          // --- Upload Area ---
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-3xl h-96 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group backdrop-blur-sm",
              isDragActive 
                ? "border-violet-500 bg-violet-500/10" 
                : "border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-white/10"
            )}
          >
            <input {...getInputProps()} />
            <div className="p-6 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-600 mb-6 shadow-lg shadow-violet-900/50 group-hover:scale-110 transition-transform">
              <Upload size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">Drag & Drop or Click</h3>
            <p className="text-gray-400">Supports JPG, PNG, WEBP (Max 50MB)</p>
          </div>
        ) : (
          // --- Editor Workspace ---
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- Left Panel: Controls --- */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Dimensions Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sliders size={18} className="text-cyan-400" /> Dimensions
                  </h3>
                  <button 
                    onClick={() => setLockRatio(!lockRatio)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Toggle Aspect Ratio Lock"
                  >
                    {lockRatio ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Width (px)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={handleWidthChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Height (px)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={handleHeightChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 flex justify-between">
                  <span>Original: {originalDimensions.width} x {originalDimensions.height}</span>
                  <span>Ratio: {aspectRatio.toFixed(2)}</span>
                </div>
              </div>

              {/* Output Settings Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ImageIcon size={18} className="text-violet-400" /> Output Format
                </h3>

                {/* Format Selection */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {['jpeg', 'png', 'webp'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={cn(
                        "py-2 rounded-lg text-sm font-medium transition-all uppercase",
                        format === fmt
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {/* Quality Slider (Not for PNG) */}
                {format !== 'png' && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Quality</span>
                      <span className="text-cyan-400 font-mono">{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                )}
              </div>

              {/* Actions Card */}
              <div className="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                    <span className="text-gray-400 text-sm">Est. File Size</span>
                    <span className="text-white font-mono font-bold text-lg">
                      {isProcessing ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        formatBytes(estimatedSize)
                      )}
                    </span>
                  </div>

                  <button
                    onClick={handleDownload}
                    disabled={isProcessing || !processedBlob}
                    className={cn(
                      "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all",
                      isProcessing
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-900/50 hover:scale-[1.02]"
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} /> Processing...
                      </>
                    ) : (
                      <>
                        <Download size={20} /> Download Image
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleReset}
                    className="text-gray-500 hover:text-white text-sm py-2 transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>

            {/* --- Right Panel: Preview --- */}
            <div className="lg:col-span-8">
              <div className="h-full min-h-[500px] bg-[#050505] border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden">
                
                {/* Preview Header */}
                <div className="absolute top-6 left-6 z-10">
                   <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs text-gray-300">
                      Preview Mode
                   </div>
                </div>

                <div className="flex-1 flex items-center justify-center relative">
                  {/* Checkerboard Background for Transparency */}
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

                  {/* Image Display */}
                  <div className="relative z-10 max-w-full max-h-full transition-all duration-300">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-sm"
                      style={{
                        // Apply slight CSS filter to simulate quality drop visually if JPEG/WebP
                        filter: format !== 'png' && quality < 100 
                          ? `blur(${isProcessing ? 2 : 0}px)` 
                          : `blur(${isProcessing ? 2 : 0}px)`
                      }}
                    />
                    
                    {/* Processing Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-sm">
                        <RefreshCw className="animate-spin text-cyan-400 w-10 h-10" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="absolute bottom-4 right-4 z-10">
                    <div className="flex gap-2">
                        <span className="bg-black/60 backdrop-blur px-3 py-1 rounded-lg border border-white/10 text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Ready
                        </span>
                    </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </main>

      {/* Hidden Canvas for Pica operations */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageResizer;
