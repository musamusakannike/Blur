import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BlurHero = () => {
  const router = useRouter();
  const textShadowStyle: React.CSSProperties = {
    textShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
  };

  return (
    <div
      className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-indigo-700 relative overflow-hidden"
      style={textShadowStyle}
    >
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white font-black text-4xl bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl"
        >
          Blur
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden md:flex gap-8 text-white font-semibold"
        >
          <a href="#about" className="hover:opacity-80 transition">About</a>
          <a href="#safety" className="hover:opacity-80 transition">Safety</a>
          <a href="#blog" className="hover:opacity-80 transition">Blog</a>
          <a href="#contact" className="hover:opacity-80 transition">Contact us</a>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-3"
        >
          <Apple size={24} />
          <span className="text-gray-400">|</span>
          <Smartphone size={24} />
        </motion.div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto px-8 py-16 relative">
        <div className="flex flex-col items-center justify-center text-center relative z-10">
          {/* Animated Wave Emoji */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              rotate: [0, 15, -10, 15, 0]
            }}
            transition={{ 
              duration: 0.8,
              rotate: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }
            }}
            className="absolute -left-20 top-0 text-7xl"
          >
            👋
          </motion.div>

          {/* Main Text */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative z-30 text-white font-black text-7xl md:text-9xl leading-tight mb-8"
          >
            anonymous<br />rooms & portals<br />no wahala
          </motion.h1>

          {/* Download Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {router.push("/create-room")}}
            className="bg-white z-30 text-blue-600 font-bold text-xl px-12 py-5 rounded-full shadow-2xl hover:shadow-3xl transition-all"
          >
            Start a room, share the code
          </motion.button>

          {/* Animated Decoration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 1,
              rotate: {
                repeat: Infinity,
                duration: 10,
                ease: "linear"
              }
            }}
            className="absolute -right-20 top-32 text-6xl"
          >
            🎈
          </motion.div>

          {/* Floating Photo 1 */}
          <motion.div
            initial={{ opacity: 0, x: -100, rotate: -15 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              y: [0, -15, 0]
            }}
            transition={{ 
              opacity: { duration: 0.8, delay: 0.7 },
              x: { duration: 0.8, delay: 0.7 },
              y: {
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut"
              }
            }}
            className="absolute left-10 md:left-32 top-64 transform -rotate-12"
          >
            <div className="w-48 h-64 md:w-56 md:h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src="/blur1.png" 
                alt="Friend 1" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Floating Photo 2 */}
          <motion.div
            initial={{ opacity: 0, x: 100, rotate: 15 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              y: [0, -20, 0]
            }}
            transition={{ 
              opacity: { duration: 0.8, delay: 0.9 },
              x: { duration: 0.8, delay: 0.9 },
              y: {
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
                delay: 0.5
              }
            }}
            className="absolute right-10 md:right-32 top-72 transform rotate-12"
          >
            <div className="w-48 h-64 md:w-56 md:h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src="/blur2.png" 
                alt="Friend 2" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Drink Icon */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
              opacity: 1, 
              y: 0
            }}
            transition={{ 
              duration: 0.8, 
              delay: 1.1 
            }}
            className="absolute left-1/4 bottom-20 text-6xl"
          >
            🥤
          </motion.div>

          {/* Peace Sign */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              rotate: [0, -10, 10, -10, 0]
            }}
            transition={{ 
              opacity: { duration: 0.6, delay: 1.2 },
              scale: { duration: 0.6, delay: 1.2 },
              rotate: {
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut"
              }
            }}
            className="absolute right-1/4 top-20 text-6xl"
          >
            ✌️
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BlurHero;