import React from 'react';
import ToolCard from '../components/ToolCard';
import { Eraser, Minimize2, Maximize2, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

const tools = [
  { 
    title: 'Remove Background', 
    description: 'Perfect cutout. Keeps original 4K resolution.', 
    icon: Eraser, 
    to: '/remove-bg', 
    gradient: 'from-pink-500 to-rose-500' 
  },
  { 
    title: 'AI Upscaler', 
    description: 'De-noise & 2x upscale using GAN models.', 
    icon: Maximize2, 
    to: '/upscale', 
    gradient: 'from-violet-500 to-purple-500' 
  },
  { 
    title: 'Pro Resizer', 
    description: 'Lanczos3 algorithm for crisp resizing.', 
    icon: Scissors, 
    to: '/resize', 
    gradient: 'from-emerald-400 to-cyan-500' 
  },
  { 
    title: 'Smart Compressor', 
    description: 'WebP optimization. Save 80% space.', 
    icon: Minimize2, 
    to: '/compress', 
    gradient: 'from-blue-400 to-indigo-500' 
  },
];

const Home = () => (
  <div className="max-w-7xl mx-auto px-4 py-20 relative">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-24"
    >
      <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-2xl">
        Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent animate-gradient">Images</span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
        Professional grade tools running entirely in your browser. <br className="hidden md:block"/>
        <span className="text-white font-semibold">100% Private. Unlimited. Free.</span>
      </p>
    </motion.div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tools.map((tool, index) => (
        <motion.div
          key={tool.to}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="h-full"
        >
          <ToolCard {...tool} />
        </motion.div>
      ))}
    </div>
  </div>
);
export default Home;
