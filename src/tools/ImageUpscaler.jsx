import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Upscaler from 'upscaler';
import { 
  Upload, 
  Download, 
  Zap, 
  Image as ImageIcon, 
  AlertCircle,
  CheckCircle2,
  ScanSearch
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ImageUpscaler = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      const objectUrl = URL.createObjectURL(uploadedFile);
      setFile(uploadedFile);
      setPreviewUrl(objectUrl);
      setProcessedUrl(null);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleUpscale = async () => {
    if (!previewUrl) return;
    setIsProcessing(true);
    setProgress(10); // Start progress

    try {
      const upscaler = new Upscaler({
        model: 'default-model', // Uses standard GAN model
      });

      // Update progress for UX
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 500);

      // Perform Upscaling
      // UpscalerJS returns a Base64 string (data:image/png...), NOT a Blob
      const upscaledDataSrc = await upscaler.upscale(previewUrl, {
        patchSize: 64, // Process in chunks to avoid freezing browser
        padding: 2
      });
      
      clearInterval(timer);
      setProgress(100);
      
      // FIX: Use the data string directly, do NOT use createObjectURL
      setProcessedUrl(upscaledDataSrc); 
      
    } catch (error) {
      console.error("Upscaling failed:", error);
      alert("Upscaling failed. Please try a smaller image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `upscaled_vividforge.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12 font-sans">
      <header className="max-w-7xl mx-auto mb-10">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
          AI Image Upscaler
        </h1>
        <p className="text-gray-500 mt-2 flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" />
          Enhance resolution up to 200% using Neural Networks.
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        {!file ? (
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-3xl h-96 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group backdrop-blur-sm",
              isDragActive 
                ? "border-fuchsia-500 bg-fuchsia-500/10" 
                : "border-white/10 bg-white/5 hover:border-fuchsia-500/50 hover:bg-white/10"
            )}
          >
            <input {...getInputProps()} />
            <div className="p-6 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 mb-6 shadow-lg shadow-violet-900/50 group-hover:scale-110 transition-transform">
              <Upload size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">Upload Low-Res Image</h3>
            <p className="text-gray-400">We'll add pixels where they're missing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Original */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 uppercase font-bold tracking-wider">Original</span>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 h-[500px] flex items-center justify-center relative">
                 <img src={previewUrl} className="max-w-full max-h-full object-contain" />
              </div>
            </div>

            {/* Upscaled Result */}
            <div className="space-y-4">
              <div className="flex items-center justify-between h-6">
                <span className="text-sm text-fuchsia-400 uppercase font-bold tracking-wider">
                  {processedUrl ? "AI Enhanced (2x)" : "Preview"}
                </span>
                {isProcessing && <span className="text-xs text-white animate-pulse">Processing: {progress}%</span>}
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 h-[500px] flex items-center justify-center relative overflow-hidden">
                 
                 {/* Empty State */}
                 {!processedUrl && !isProcessing && (
                    <div className="text-center">
                       <ScanSearch size={48} className="mx-auto text-gray-600 mb-4" />
                       <button 
                         onClick={handleUpscale}
                         className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
                       >
                         Start Upscaling
                       </button>
                    </div>
                 )}

                 {/* Loading State */}
                 {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                           <div 
                             className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                             style={{ width: `${progress}%` }}
                           />
                        </div>
                        <p className="text-white font-mono animate-pulse">Running Neural Network...</p>
                    </div>
                 )}

                 {/* Result */}
                 {processedUrl && (
                    <img src={processedUrl} className="max-w-full max-h-full object-contain shadow-2xl shadow-fuchsia-900/20" />
                 )}
              </div>

              {processedUrl && (
                <div className="flex gap-4">
                   <button 
                     onClick={handleDownload}
                     className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                   >
                     <Download size={18} /> Download High-Res
                   </button>
                   <button 
                     onClick={() => setFile(null)}
                     className="px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                   >
                     Reset
                   </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ImageUpscaler;
