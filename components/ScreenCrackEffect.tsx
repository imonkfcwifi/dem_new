
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScreenCrackEffectProps {
    active: boolean;
}

const ScreenCrackEffect: React.FC<ScreenCrackEffectProps> = ({ active }) => {
    if (!active) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
            {/* 1. Main Crack SVG */}
            <motion.svg
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.1, type: "spring", stiffness: 300, damping: 10 }}
                viewBox="0 0 100 100"
                className="absolute top-0 left-0 w-full h-full text-white/80"
            >
                <path d="M50 50 L20 20 M50 50 L80 10 M50 50 L90 60 M50 50 L30 80 M50 50 L10 50" stroke="currentColor" strokeWidth="0.2" fill="none" />
                <path d="M50 50 L55 45 L60 48 L65 40" stroke="currentColor" strokeWidth="0.1" fill="none" />
                <path d="M50 50 L45 55 L40 52 L35 60" stroke="currentColor" strokeWidth="0.1" fill="none" />
            </motion.svg>

            {/* 2. Glass Shards Flying */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 1, x: window.innerWidth / 2, y: window.innerHeight / 2, rotate: 0 }}
                    animate={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        rotate: Math.random() * 360,
                        opacity: 0
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute bg-white/50 backdrop-blur-sm"
                    style={{
                        width: Math.random() * 20 + 5 + 'px',
                        height: Math.random() * 20 + 5 + 'px',
                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                    }}
                />
            ))}

            {/* 3. Glitch Overlay */}
            <motion.div
                animate={{ opacity: [0, 0.2, 0, 0.1, 0] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute inset-0 bg-red-500/10 mix-blend-color-dodge"
            />
        </div>
    );
};

export default ScreenCrackEffect;
