import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Navbar = () => (
  <nav className="bg-dark-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-lg group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            VividForge
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <span className="text-xs font-mono text-brand-accent px-3 py-1 rounded-full border border-brand-accent/30 bg-brand-accent/10">
            v2.0 PRO • CLIENT-SIDE
          </span>
        </div>
      </div>
    </div>
  </nav>
);
export default Navbar;
