import React from 'react';
import { motion } from 'motion/react';
import farmBg from '../assets/farm_background.jpg';

export default function Background() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#eaf3e5]">
      {/* Base generated image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: `url(${farmBg})` }}
      />
      
      {/* Overlay gradient for readability and warmth */}
      <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-green-800/20 to-transparent mix-blend-multiply" />
      
      {/* Glassmorphism subtle overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-white/10" />

      {/* Floating particles (simulating pollen/leaves/dust) */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-yellow-100/60 rounded-full blur-[1px]"
          initial={{
            y: "100vh",
            x: Math.random() * 100 + "vw",
            opacity: 0,
          }}
          animate={{
            y: "-10vh",
            x: Math.random() * 100 + "vw",
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10,
          }}
        />
      ))}
    </div>
  );
}

