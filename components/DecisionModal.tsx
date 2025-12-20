
import React, { useEffect, useState, useRef } from 'react';
import { PendingDecision } from '../types';
import { audio } from '../services/audioService';
import { MessageCircle, X, Scroll, Hourglass, HelpCircle, Minimize2, Maximize2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RichText from './RichText';

interface DecisionModalProps {
  decision: PendingDecision;
  isLoading?: boolean;
  keywords: string[]; // Expanded list
  onDecide: (optionId: string | null) => void;
  onLinkClick: (keyword: string) => void;
}

const TIMEOUT_SECONDS = 30;

const DecisionModal: React.FC<DecisionModalProps> = ({ decision, isLoading = false, keywords, onDecide, onLinkClick }) => {
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Interaction States
  const [interactionState, setInteractionState] = useState<'idle' | 'processing'>('idle');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null); // 'silence' for ignore

  const isProcessing = interactionState === 'processing' || isLoading;

  // Tracks if the external loading state has actually triggered yet.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
      if (isLoading) {
          hasLoadedRef.current = true;
      }
  }, [isLoading]);

  // Reset logic
  useEffect(() => {
    if (!isLoading && interactionState === 'processing' && hasLoadedRef.current) {
       setInteractionState('idle');
       hasLoadedRef.current = false;
    }
  }, [isLoading, interactionState]);

  // Safety timeout
  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (interactionState === 'processing' && !isLoading && !hasLoadedRef.current) {
          timer = setTimeout(() => {
              setInteractionState('idle');
          }, 5000);
      }
      return () => clearTimeout(timer);
  }, [interactionState, isLoading]);

  useEffect(() => {
    if (isProcessing) return; // Stop timer when processing

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, TIMEOUT_SECONDS - (elapsed / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSilence(); // Auto-silence
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onDecide, isProcessing]);

  const handleOptionClick = (optionId: string) => {
      if (isProcessing) return;
      
      audio.playDivinePresence(); // Play major sound
      setInteractionState('processing');
      setSelectedOptionId(optionId);

      // Delay actual action to show feedback (now in mini view)
      setTimeout(() => {
          onDecide(optionId);
      }, 1500);
  };

  const handleSilence = () => {
      if (isProcessing) return;

      audio.playClick();
      setInteractionState('processing');
      setSelectedOptionId('silence');

      setTimeout(() => {
          onDecide(null);
      }, 1500);
  };

  const progressPercentage = (timeLeft / TIMEOUT_SECONDS) * 100;
  const safeOptions = Array.isArray(decision?.options) ? decision.options : [];

  // --- 1. PROCESSING STATE (MINI TOAST) ---
  // Replaces the full screen overlay with a small non-intrusive notification
  if (isProcessing) {
      return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[60] flex flex-col items-end gap-2"
        >
            <div className="bg-[#1a1c23] border border-god-gold/50 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] p-4 flex items-center gap-4 relative overflow-hidden">
                {/* Background shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-god-gold/10 to-transparent animate-shine pointer-events-none" />
                
                <div className="relative">
                    {selectedOptionId === 'silence' ? (
                        <div className="p-2 rounded-full bg-slate-800 border border-slate-600">
                             <X size={20} className="text-slate-400" />
                        </div>
                    ) : (
                        <div className="p-2 rounded-full bg-god-gold/20 border border-god-gold">
                             <Sparkles size={20} className="text-god-gold animate-pulse" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col min-w-[140px]">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1">
                        {selectedOptionId === 'silence' ? 'Divine Silence' : 'Divine Decree'}
                    </span>
                    <span className="text-sm font-bold text-slate-200">
                        {isLoading ? "역사에 기록 중..." : "신탁 전달 중..."}
                    </span>
                </div>

                <Loader2 size={16} className="text-slate-500 animate-spin ml-2" />
            </div>
        </motion.div>
      );
  }

  // --- 2. MINIMIZED STATE (PENDING) ---
  if (isMinimized) {
    return (
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[60] flex flex-col items-end gap-2"
      >
        <div className="bg-[#1a1c23] border border-god-gold rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] p-3 flex items-center gap-3 animate-pulse-slow">
           <div className="relative">
              <MessageCircle className="text-god-gold w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
           </div>
           
           <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Decision Pending</span>
              <span className="text-xs font-bold text-slate-200">{decision?.senderName}</span>
           </div>

           <div className="h-8 w-px bg-white/10 mx-1" />

           <div className="flex flex-col items-center min-w-[40px]">
              <span className={`font-mono text-sm font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-god-gold'}`}>
                {Math.ceil(timeLeft)}s
              </span>
           </div>

           <button 
             onClick={() => setIsMinimized(false)}
             className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors"
           >
             <Maximize2 size={16} />
           </button>
        </div>
      </motion.div>
    );
  }

  // --- 3. FULL MODAL VIEW ---
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Container */}
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#1a1c23] border border-god-gold rounded-xl shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden transform transition-all scale-100">
        
        {/* Progress Bar (The Fuse) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 z-20">
            <motion.div 
                className="h-full bg-god-gold shadow-[0_0_10px_#D4AF37]"
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
            />
        </div>

        {/* Decorative Header Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-god-gold/20 to-transparent pointer-events-none z-0" />
        
        {/* Header Controls (Minimize) */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button 
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white transition-colors backdrop-blur-sm"
                title="Minimize"
            >
                <Minimize2 size={16} />
            </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 overflow-y-auto scrollbar-hide">
            
            <motion.div 
                key="idle"
                exit={{ opacity: 0, filter: "blur(4px)" }}
                className="flex flex-col items-center text-center"
            >
                {/* Timer Display */}
                <div className="absolute top-2 left-4 text-[10px] font-mono text-god-gold/60 flex items-center gap-1">
                    <Hourglass size={10} />
                    <span>침묵까지 {Math.ceil(timeLeft)}초</span>
                </div>

                {/* Avatar */}
                <div className="mb-4 p-4 rounded-full bg-slate-900 border-2 border-god-gold/50 shadow-inner flex-shrink-0 mt-2 relative group">
                    <MessageCircle className="w-8 h-8 text-god-gold group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 rounded-full border border-god-gold/30 animate-pulse-slow"></div>
                </div>

                <div className="mb-2 flex-shrink-0">
                    <h2 className="font-display text-xl md:text-2xl text-god-gold font-bold tracking-widest">{decision?.senderName || 'Unknown'}</h2>
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">{decision?.senderRole || 'Prophet'}</p>
                </div>

                {/* The Petition */}
                <div className="my-6 relative flex-shrink-0 w-full bg-slate-900/50 p-4 rounded-lg border border-white/5">
                    <Scroll className="absolute -top-3 -left-2 w-6 h-6 text-god-gold/40 bg-[#1a1c23] rounded-full p-0.5" />
                    <p className="font-serif text-lg md:text-xl text-slate-200 italic leading-relaxed px-2">
                    "<RichText content={decision?.message || '...'} keywords={keywords} onLinkClick={onLinkClick} />"
                    </p>
                </div>

                {/* Choices */}
                <div className="w-full space-y-3 mt-2">
                    {safeOptions.length > 0 ? (
                    safeOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => handleOptionClick(opt.id)}
                            onMouseEnter={() => audio.playHover()}
                            className="w-full group relative p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-god-gold hover:bg-slate-800 transition-all text-left overflow-hidden shrink-0 shadow-sm hover:shadow-md hover:translate-x-1"
                        >
                            <div className="relative z-10 flex flex-col">
                            <span className="font-sans font-bold text-slate-200 group-hover:text-god-gold transition-colors text-sm md:text-base">
                                <RichText content={opt.text} keywords={keywords} onLinkClick={onLinkClick} />
                            </span>
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500 mt-1 group-hover:text-slate-400 font-serif italic">
                                <HelpCircle size={10} />
                                <span>예지: {opt.consequenceHint}</span>
                            </div>
                            </div>
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-god-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))
                    ) : (
                    <div className="text-slate-500 text-xs italic">선택지가 보이지 않습니다. 침묵하십시오.</div>
                    )}
                </div>

                {/* Ignore / Silence Option */}
                <div className="w-full mt-6 pt-6 border-t border-slate-800 flex-shrink-0">
                    <button
                        onClick={handleSilence}
                        className="w-full py-3 text-slate-500 hover:text-slate-300 font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group border border-transparent hover:border-slate-700 rounded"
                    >
                        <X className="w-3 h-3 group-hover:text-red-400 transition-colors" />
                        <span>기도를 무시하고 침묵하기 ({Math.ceil(timeLeft)}s)</span>
                    </button>
                    <p className="text-[10px] text-slate-600 mt-2">
                        * 침묵 또한 신의 뜻으로 해석되어 역사에 기록됩니다.
                    </p>
                </div>
            </motion.div>
            
        </div>
      </div>
    </div>
  );
};

export default DecisionModal;
