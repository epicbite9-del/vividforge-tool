import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ToolCard = ({ title, description, icon: Icon, to, gradient }) => (
  <Link to={to}>
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative overflow-hidden bg-dark-800 border border-white/10 rounded-2xl p-6 h-full hover:border-brand-primary/50 transition-colors group"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
      
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient} shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  </Link>
);
export default ToolCard;
