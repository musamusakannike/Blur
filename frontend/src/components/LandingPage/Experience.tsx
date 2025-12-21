import React from 'react';
import { motion } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';

const Experience = () => {
  const textShadowStyle: React.CSSProperties = {
    textShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
  };

  return (
    <div
      className="min-h-screen bg-linear-to-b from-indigo-700 via-black via-30% to-black relative overflow-hidden flex items-center justify-center px-8 py-16"
      style={textShadowStyle}
    >
      {/* Main Heading */}
      <div className="text-center relative z-10">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-white font-black text-6xl lg:text-8xl leading-tight mb-4"
        >
          drop a code<br />start a room
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <p className="text-white font-black text-4xl md:text-6xl lg:text-7xl">
            anonymous chat
          </p>
          <p className="text-white font-black text-2xl md:text-4xl lg:text-6xl">
            rooms expire in hours
          </p>
          <p className="text-white font-black  md:text-4xl">
            collect messages with portals
          </p>
        </motion.div>
      </div>

      {/* Animated Pointer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="absolute left-[15%] top-[35%]"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
        >
          <MousePointer2 size={80} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Speech Bubble 1 - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -100, rotate: -10 }}
        whileInView={{ opacity: 1, x: 0, rotate: -5 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        viewport={{ once: true }}
        className="absolute left-[8%] top-[15%]"
      >
        <motion.div
          animate={{ 
            rotate: [-5, -8, -5],
            y: [0, -5, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut"
          }}
          className="bg-white rounded-full px-8 py-6 shadow-2xl relative"
        >
          <p className="text-black font-bold text-lg md:text-xl text-center leading-tight">
            Omo, no stress.<br />Just share code<br />make una yarn.
          </p>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
        </motion.div>
      </motion.div>

      {/* Speech Bubble 2 - Middle Left */}
      <motion.div
        initial={{ opacity: 0, x: -100, rotate: 10 }}
        whileInView={{ opacity: 1, x: 0, rotate: 5 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        viewport={{ once: true }}
        className="absolute left-[10%] top-[50%]"
      >
        <motion.div
          animate={{ 
            rotate: [5, 8, 5],
            y: [0, -8, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 3.5,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="bg-white rounded-full px-8 py-6 shadow-2xl relative"
        >
          <p className="text-black font-bold text-lg md:text-xl text-center leading-tight">
            Drop message<br />for portal side—<br />anonymous gidigba.
          </p>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
        </motion.div>
      </motion.div>

      {/* Pizza Slice */}
      <motion.div
        initial={{ opacity: 0, y: 100, rotate: -30 }}
        whileInView={{ opacity: 1, y: 0, rotate: -15 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        viewport={{ once: true }}
        className="absolute left-[12%] bottom-[15%]"
      >
        <motion.div
          animate={{ 
            rotate: [-15, -20, -15],
            y: [0, -10, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut"
          }}
          className="text-9xl"
        >
          🍕
        </motion.div>
      </motion.div>

      {/* Skateboard */}
      <motion.div
        initial={{ opacity: 0, x: 100, rotate: 30 }}
        whileInView={{ opacity: 1, x: 0, rotate: 15 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
        className="absolute right-[15%] top-[20%]"
      >
        <motion.div
          animate={{ 
            rotate: [15, 20, 15],
            x: [0, 10, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut"
          }}
          className="text-8xl"
        >
          🛹
        </motion.div>
      </motion.div>

      {/* Speech Bubble 3 - Top Right */}
      <motion.div
        initial={{ opacity: 0, x: 100, rotate: -10 }}
        whileInView={{ opacity: 1, x: 0, rotate: -5 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        viewport={{ once: true }}
        className="absolute right-[8%] top-[35%]"
      >
        <motion.div
          animate={{ 
            rotate: [-5, -8, -5],
            y: [0, -6, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 3.2,
            ease: "easeInOut",
            delay: 0.8
          }}
          className="bg-white rounded-full px-8 py-6 shadow-2xl relative"
        >
          <p className="text-black font-bold text-lg md:text-xl text-center leading-tight">
            Send text,<br />image, audio—<br />if dem allow am.
          </p>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
        </motion.div>
      </motion.div>

      {/* Cloud */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        viewport={{ once: true }}
        className="absolute right-[12%] bottom-[30%]"
      >
        <motion.div
          animate={{ 
            x: [0, 15, 0],
            y: [0, -10, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut"
          }}
          className="text-9xl"
        >
          ☁️
        </motion.div>
      </motion.div>

      {/* Speech Bubble 4 - Bottom Right */}
      <motion.div
        initial={{ opacity: 0, y: 100, rotate: 10 }}
        whileInView={{ opacity: 1, y: 0, rotate: 5 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        viewport={{ once: true }}
        className="absolute right-[10%] bottom-[12%]"
      >
        <motion.div
          animate={{ 
            rotate: [5, 8, 5],
            y: [0, -7, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 3.8,
            ease: "easeInOut",
            delay: 1.2
          }}
          className="bg-white rounded-full px-8 py-6 shadow-2xl relative"
        >
          <p className="text-black font-bold text-lg md:text-xl text-center leading-tight">
            No long story—<br />everything expire<br />after small time.
          </p>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
        </motion.div>
      </motion.div>

      {/* Made with Framer Badge */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        viewport={{ once: true }}
        className="absolute bottom-8 right-8 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      >
        <span className="text-sm font-semibold">Made in Framer</span>
      </motion.div>
    </div>
  );
};

export default Experience;