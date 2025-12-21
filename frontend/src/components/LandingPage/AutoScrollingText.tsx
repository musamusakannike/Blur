"use client";

import { motion } from "framer-motion";

interface AutoScrollingTextProps {
  sentences: string[];
  speed?: number; // lower = faster
}

export default function AutoScrollingText({
  sentences,
  speed = 40,
}: AutoScrollingTextProps) {
  // Duplicate content to create seamless loop
  const content = [...sentences, ...sentences];

  return (
    <div className="relative w-full overflow-hidden bg-black py-6">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-linear-to-r from-black to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-linear-to-l from-black to-transparent z-10" />

      {/* Scrolling container */}
      <motion.div
        className="flex w-max gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          ease: "linear",
          duration: speed,
          repeat: Infinity,
        }}
      >
        {content.map((text, index) => (
          <span
            key={index}
            className="text-white text-lg md:text-xl font-medium opacity-90"
          >
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
