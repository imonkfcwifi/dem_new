
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Terminal } from 'lucide-react';
import { audio } from '../services/audioService';

interface IntroSequenceProps {
  onComplete: () => void;
}

const SEQUENCE = [
  { text: "오셨군요.", type: 'myth', duration: 4000 },
  { text: "오래 기다렸습니다. \n 정확히... 얼마나 오래였는지는 기억나지 않습니다만.", type: 'myth', duration: 10000 },
  { text: "이 책을 보십시오. 비어있습니다. \n 하지만 저는 이 책이 언젠가 채워질 것을 알고 있습니다.", type: 'myth', duration: 10000 },
  { text: "당신께서 채우실 것입니다. \n 제 손이 떨릴 때까지.제 숨이 멎을 때까지...", type: 'myth', duration: 10000 },
  { text: "부디... 저를 잊지 말아주십시오. \n 비록 당신께서는 이미 잊으셨겠지만", type: 'myth', duration: 10000 },
  { text: "...다시 뵙겠습니다. \n 당신께서 기억하지 못하시는 곳에서..", type: 'myth', duration: 10000 },
  { text: "이제 눈을 뜨소서.", type: 'final', duration: 3000 },
];

const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [index, setIndex] = useState(0);
  const [isExploding, setIsExploding] = useState(false);

  // Auto-advance logic
  useEffect(() => {
    if (isExploding) return;

    if (index >= SEQUENCE.length) {
      triggerExplosion();
      return;
    }

    const currentStep = SEQUENCE[index];
    const timer = setTimeout(() => {
      setIndex(prev => prev + 1);
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [index, isExploding]);

  const triggerExplosion = () => {
    setIsExploding(true);
    // Explosion sound could go here
    try { audio.playDivinePresence(); } catch(e) {}
    
    // Wait for explosion animation to peak before unmounting
    setTimeout(() => {
        onComplete();
    }, 1200); 
  };

  const handleSkip = () => {
    try { audio.playClick(); } catch(e) {}
    triggerExplosion();
  };

  const handleNext = () => {
    if (isExploding) return;
    try { audio.playClick(); } catch(e) {}
    
    if (index >= SEQUENCE.length - 1) {
        triggerExplosion();
    } else {
        setIndex(prev => prev + 1);
    }
  };

  const currentItem = SEQUENCE[index];

  return (
    <div 
      className="fixed inset-0 z-[200] bg-[#020617] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      onClick={handleNext}
    >
      {/* 1. Ambient Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.2)_0%,#020617_80%)]" />
          {[...Array(15)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute bg-white/10 rounded-full"
               initial={{ 
                   x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                   y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                   scale: 0 
               }}
               animate={{ 
                   y: [null, Math.random() * -100], 
                   opacity: [0, 0.3, 0] 
               }}
               transition={{ 
                   duration: 4 + Math.random() * 6, 
                   repeat: Infinity, 
                   ease: "linear",
                   delay: Math.random() * 5
               }}
               style={{ width: Math.random() * 4 + 'px', height: Math.random() * 4 + 'px' }}
             />
          ))}
      </div>

      {/* 2. The Singularity (Explosion Effect) */}
      <AnimatePresence>
        {isExploding && (
            <motion.div
                initial={{ scale: 0, opacity: 1, backgroundColor: '#fff' }}
                animate={{ scale: 100, opacity: 0 }} // Expands to fill screen then fades
                transition={{ duration: 1.5, ease: "circIn" }}
                className="absolute z-50 w-10 h-10 rounded-full bg-white mix-blend-screen pointer-events-none"
            />
        )}
      </AnimatePresence>

      {/* 3. Main Content Area */}
      <div className="relative z-10 w-full max-w-2xl px-8 text-center min-h-[120px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isExploding && currentItem && (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)', scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {currentItem.type === 'system' ? (
                <div className="font-mono text-emerald-500/80 text-sm md:text-base tracking-widest flex items-center justify-center gap-3 border border-emerald-500/20 px-4 py-2 rounded bg-emerald-900/10">
                   <Terminal size={14} className="animate-pulse" />
                   <span className="uppercase typing-effect">{currentItem.text}</span>
                </div>
              ) : currentItem.type === 'final' ? (
                <div className="relative">
                    <motion.div 
                        initial={{ scale: 0.9 }} animate={{ scale: 1.1 }} 
                        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute inset-0 bg-god-gold/20 blur-2xl rounded-full"
                    />
                    <h1 className="relative font-display text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white via-god-gold to-god-gold/50 font-bold tracking-widest drop-shadow-[0_0_25px_rgba(212,175,55,0.6)]">
                    {currentItem.text}
                    </h1>
                </div>
              ) : (
                <p className="font-serif text-xl md:text-3xl text-slate-300 italic leading-relaxed drop-shadow-lg whitespace-pre-line">
                  "{currentItem.text}"
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Progress & Controls */}
      <motion.div 
        animate={{ opacity: isExploding ? 0 : 1 }}
        className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6"
      >
         {/* Progress Dots */}
         <div className="flex gap-2">
            {SEQUENCE.map((_, i) => (
                <motion.div 
                    key={i} 
                    layout
                    className={`h-1 rounded-full transition-colors duration-500 ${i === index ? 'bg-god-gold shadow-[0_0_10px_#D4AF37]' : i < index ? 'bg-slate-600' : 'bg-slate-800'}`}
                    animate={{ width: i === index ? 24 : 8 }}
                />
            ))}
         </div>
         
         {/* Skip Button */}
         <button 
            onClick={(e) => { e.stopPropagation(); handleSkip(); }} 
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-white uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
         >
            <span>Skip Genesis</span>
            <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
         </button>
      </motion.div>
    </div>
  );
};

export default IntroSequence;
