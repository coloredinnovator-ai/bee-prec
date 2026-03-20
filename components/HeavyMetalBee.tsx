'use client';

import React from 'react';
import { motion } from 'motion/react';

export function HeavyMetalBee({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <motion.svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]"
        initial={{ y: 0 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Wings - Metal Plate Style */}
        <motion.path
          d="M100 80 C 40 20, 20 60, 40 100"
          fill="#52525b"
          stroke="#18181b"
          strokeWidth="2"
          initial={{ rotate: 0 }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />
        <motion.path
          d="M100 80 C 160 20, 180 60, 160 100"
          fill="#52525b"
          stroke="#18181b"
          strokeWidth="2"
          initial={{ rotate: 0 }}
          animate={{ rotate: [5, -5, 5] }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />

        {/* Body - Armored Sections */}
        {/* Abdomen */}
        <path d="M70 110 Q 100 180, 130 110" fill="#eab308" stroke="#18181b" strokeWidth="3" />
        <path d="M75 130 L 125 130" stroke="#18181b" strokeWidth="8" strokeLinecap="round" />
        <path d="M80 150 L 120 150" stroke="#18181b" strokeWidth="8" strokeLinecap="round" />

        {/* Thorax - Metal Jacket */}
        <rect x="70" y="70" width="60" height="50" rx="10" fill="#3f3f46" stroke="#18181b" strokeWidth="3" />
        <path d="M70 95 L 130 95" stroke="#18181b" strokeWidth="1" opacity="0.5" />
        
        {/* Rivets */}
        <circle cx="78" cy="78" r="2" fill="#71717a" />
        <circle cx="122" cy="78" r="2" fill="#71717a" />
        <circle cx="78" cy="112" r="2" fill="#71717a" />
        <circle cx="122" cy="112" r="2" fill="#71717a" />

        {/* Head - Helmet Style */}
        <path d="M80 70 Q 100 30, 120 70" fill="#eab308" stroke="#18181b" strokeWidth="3" />
        <path d="M85 60 L 115 60" fill="#18181b" stroke="#18181b" strokeWidth="1" /> {/* Visor */}
        
        {/* Eyes - Glowing Red */}
        <motion.circle
          cx="90" cy="55" r="3"
          fill="#ef4444"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="110" cy="55" r="3"
          fill="#ef4444"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Antennae - Spiky/Metal */}
        <path d="M90 40 L 80 20" stroke="#18181b" strokeWidth="2" />
        <path d="M110 40 L 120 20" stroke="#18181b" strokeWidth="2" />
        
        {/* Stinger - Sharp Metal */}
        <path d="M100 175 L 95 195 L 105 195 Z" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />
      </motion.svg>
    </div>
  );
}
