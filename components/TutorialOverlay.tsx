
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles, Feather, Hand } from 'lucide-react';
import { audio } from '../services/audioService';

export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  mobileTab?: 'map' | 'chronicle' | 'stats' | 'lore';
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onStepChange: (stepIndex: number) => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, onComplete, onStepChange }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  
  const currentStep = steps[currentStepIndex];
  
  // Ref to track the last index we notified the parent about to prevent loop/thrashing
  const lastNotifiedIndex = useRef<number>(-1);

  // Effect 1: Notify parent when step changes
  useEffect(() => {
    if (lastNotifiedIndex.current !== currentStepIndex) {
        onStepChange(currentStepIndex);
        lastNotifiedIndex.current = currentStepIndex;
    }
  }, [currentStepIndex, onStepChange]);

  // Helper function to find the *visible* element when multiple might exist (Mobile vs Desktop)
  const getVisibleRect = (id: string): DOMRect | null => {
      if (id === 'center') return null;

      const elements = document.querySelectorAll(`#${id}`);
      for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const rect = el.getBoundingClientRect();
          // Check if element has dimensions (is not display:none)
          if (rect.width > 0 && rect.height > 0) {
              // Double check computed style for safety
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                  return rect;
              }
          }
      }
      return null;
  };

  // Effect 2: Update target position/rect when step changes
  useEffect(() => {
    // Clear rect immediately to avoid ghosting
    setTargetRect(null);

    if (currentStep.targetId === 'center') {
      return;
    }

    const updateRect = () => {
        const rect = getVisibleRect(currentStep.targetId);
        if (rect) {
            setTargetRect(rect);
            return true;
        }
        return false;
    };

    // Try finding the element immediately
    if (updateRect()) return;

    // If not found (e.g. mobile tab switching transition), poll for it
    let attempts = 0;
    const intervalId = setInterval(() => {
        if (updateRect()) {
            clearInterval(intervalId);
        }
        attempts++;
        if (attempts > 20) { // Stop polling after ~2 seconds
            clearInterval(intervalId);
        }
    }, 100);
    
    return () => clearInterval(intervalId);

  }, [currentStepIndex, currentStep.targetId]);

  // Effect 3: Handle Resize and Scroll updates
  useEffect(() => {
     if (currentStep.targetId === 'center') return;

     const updateRect = () => {
        const rect = getVisibleRect(currentStep.targetId);
        if (rect) setTargetRect(rect);
     };

     window.addEventListener('resize', updateRect);
     window.addEventListener('scroll', updateRect, true); // Capture scroll events

     return () => {
         window.removeEventListener('resize', updateRect);
         window.removeEventListener('scroll', updateRect, true);
     };
  }, [currentStepIndex, currentStep.targetId]);

  // Typewriter Effect Logic
  useEffect(() => {
    setDisplayedContent('');
    
    const text = currentStep.content;
    let charIndex = 0;
    
    const timer = setInterval(() => {
        charIndex++;
        if (charIndex <= text.length) {
            setDisplayedContent(text.slice(0, charIndex));
        } else {
            clearInterval(timer);
        }
    }, 20); // Typing speed

    return () => clearInterval(timer);
  }, [currentStepIndex, currentStep.content]);

  const handleNext = () => {
    audio.playClick();
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    audio.playClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    audio.playClick();
    onComplete();
  };

  // --- POSITION LOGIC ---
  const getDialogueStyle = (): React.CSSProperties => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    const baseStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 10010, // Increased z-index to be above the hand pointer
        display: 'flex',
        flexDirection: 'column',
    };

    // Mobile: Dynamic positioning based on target location
    if (isMobile) {
        // Check if target is in the bottom half of the screen
        const isTargetBottomHalf = targetRect && (targetRect.top + targetRect.height / 2 > screenHeight * 0.5);
        
        return {
            ...baseStyle,
            left: '16px',
            right: '16px',
            width: 'auto',
            transform: 'none',
            // If target is low, put box at top. If target is high (or null/center), put box at bottom.
            top: isTargetBottomHalf ? 'calc(60px + env(safe-area-inset-top))' : 'auto',
            bottom: isTargetBottomHalf ? 'auto' : 'calc(40px + env(safe-area-inset-bottom))',
            maxHeight: '40vh',
            margin: 0
        };
    }

    // Desktop: Target-based positioning
    if (!targetRect) {
        return {
            ...baseStyle,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(90vw, 480px)',
            maxHeight: '70vh',
        };
    }

    const targetCenterY = targetRect.top + (targetRect.height / 2);
    // If target is in the lower half (> 55%), put dialogue at TOP.
    const isTargetLow = targetCenterY > (screenHeight * 0.55);

    return {
        ...baseStyle,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '480px',
        top: isTargetLow ? '80px' : 'auto',
        bottom: isTargetLow ? 'auto' : '100px',
        maxHeight: '55vh',
    };
  };

  const dialogueStyle = getDialogueStyle();
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isTargetBottom = targetRect && (targetRect.top + targetRect.height/2 > screenHeight * 0.5);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
      {/* 1. Backdrop with Hole (Cutout effect) */}
      <motion.div 
        className="absolute inset-0 transition-all duration-500 ease-in-out pointer-events-none"
        style={{
            backgroundColor: targetRect ? 'transparent' : 'rgba(0,0,0,0.85)',
            // This creates a "hole" in the backdrop around the target
            boxShadow: targetRect 
                ? `0 0 0 9999px rgba(0, 0, 0, 0.85)`
                : 'none',
            left: targetRect ? targetRect.left : '50%',
            top: targetRect ? targetRect.top : '50%',
            width: targetRect ? targetRect.width : 0,
            height: targetRect ? targetRect.height : 0,
            borderRadius: '12px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* 2. The Highlight Box Border */}
      <AnimatePresence>
        {targetRect && (
            <motion.div 
                layoutId="highlight-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                    opacity: 1, 
                    scale: 1,
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute border-2 border-god-gold/80 rounded-xl pointer-events-none shadow-[0_0_30px_rgba(212,175,55,0.3)]"
            >
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-god-gold" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-god-gold" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-god-gold" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-god-gold" />
            </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Hand Pointer (Visual Guide) */}
      <AnimatePresence>
        {targetRect && (
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, y: [0, isTargetBottom ? 10 : -10, 0] }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute z-[10005] pointer-events-none drop-shadow-lg"
                style={{
                    left: targetRect.left + (targetRect.width / 2),
                    top: isTargetBottom ? targetRect.top - 80 : targetRect.bottom + 40, // Increased offset to avoid covering content
                    x: "-50%"
                }}
                transition={{ 
                    y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                    opacity: { duration: 0.3 }
                }}
            >
                 <div className={`p-2 bg-black/80 backdrop-blur-sm rounded-full border border-god-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.3)] ${isTargetBottom ? 'rotate-180' : ''}`}>
                    <Hand size={24} className="text-god-gold fill-god-gold/20" />
                 </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 4. The Dialogue Box */}
      <motion.div
        key={currentStepIndex}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={dialogueStyle}
        className="pointer-events-auto flex flex-col shadow-[0_10px_60px_rgba(0,0,0,0.9)] rounded-lg transition-all duration-300"
      >
        <div className="bg-[#0f1014] border border-god-gold/40 p-1 rounded-lg relative group flex flex-col h-full overflow-hidden">
            
            <div className="bg-[#15171e] rounded p-4 md:p-5 relative overflow-hidden border border-white/5 flex flex-col h-full min-h-0">
                <div className="absolute inset-0 bg-gradient-to-br from-god-gold/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="absolute top-0 right-0 w-20 h-20 bg-god-gold/10 blur-[40px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full min-h-0">
                    <div className="flex justify-between items-start mb-2 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 md:p-2 rounded-full bg-god-gold/10 border border-god-gold/20 shadow-inner">
                                <Feather size={16} className="text-god-gold" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] md:text-[10px] font-mono text-god-gold/60 uppercase tracking-widest truncate max-w-[150px]">
                                    The Scribe's Guide &bull; {currentStepIndex + 1}/{steps.length}
                                </span>
                                <span className="text-[10px] text-slate-500 font-serif italic">
                                    기록자(The Chronicler)
                                </span>
                            </div>
                        </div>
                        <button onClick={handleSkip} className="text-slate-600 hover:text-slate-300 transition-colors p-1">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 mb-3 pr-1 scrollbar-hide">
                        <h3 className="font-display font-bold text-base md:text-xl text-[#E2E8F0] mb-2 leading-tight drop-shadow-sm sticky top-0 bg-[#15171e]/95 z-10 py-1">
                            {currentStep.title}
                        </h3>
                        <div className="font-serif text-slate-400 text-sm md:text-[15px] leading-relaxed border-l-2 border-slate-700 pl-3 md:pl-4 pb-2 break-keep break-words whitespace-pre-line">
                            <span className="text-slate-300">
                                {displayedContent}
                                <span className="inline-block w-1.5 h-4 ml-1 bg-god-gold animate-pulse align-middle" />
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/5 shrink-0 mt-auto bg-[#15171e]">
                        <div className="flex gap-1">
                            {steps.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`h-1.5 rounded-full transition-all duration-500 ease-out ${idx === currentStepIndex ? 'w-6 md:w-8 bg-god-gold shadow-[0_0_5px_#D4AF37]' : 'w-1.5 md:w-2 bg-slate-800'}`} 
                                />
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {currentStepIndex > 0 && (
                                <button 
                                    onClick={handlePrev}
                                    className="p-1.5 md:p-2 text-slate-500 hover:text-slate-300 transition-colors border border-transparent hover:border-slate-700 rounded"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            )}
                            <button 
                                onClick={handleNext}
                                className="group flex items-center gap-2 px-4 md:px-6 py-2 bg-gradient-to-r from-god-gold to-[#b49028] text-[#0f1014] rounded font-bold text-[10px] md:text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] shrink-0"
                            >
                                {currentStepIndex === steps.length - 1 ? (
                                    <span className="flex items-center gap-2">Begin <Sparkles size={14} className="animate-spin-slow" /></span>
                                ) : (
                                    <span className="flex items-center gap-1">Next <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorialOverlay;
