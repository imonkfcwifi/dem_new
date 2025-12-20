
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, LogType } from '../types';
import { audio } from '../services/audioService';
import { Book, Copy, Check, Feather, Image as ImageIcon, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RichText from './RichText';

interface ChronicleProps {
  logs: LogEntry[];
  keywords: string[]; // Changed from factions to generic keywords
  onLinkClick: (keyword: string) => void;
}

const Chronicle: React.FC<ChronicleProps> = ({ logs, keywords, onLinkClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Smart Scrolling State
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Check if near bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom) {
      setAutoScroll(true);
      setShowScrollButton(false);
    } else {
      setAutoScroll(false);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true);
    setShowScrollButton(false);
  };

  // Effect: When logs change, scroll if autoScroll is true
  useEffect(() => {
    if (autoScroll) {
      // Small delay to ensure rendering before scrolling
      const timer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // If we received new logs but didn't scroll, show the button
      setShowScrollButton(true);
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    audio.playClick();
    const textHistory = logs.map(log => {
      let prefix = `[AD ${log.year}]`;
      if (log.type === LogType.SCRIPTURE) prefix += ` [성서]`;
      return `${prefix} ${log.content}`;
    }).join('\n\n');

    navigator.clipboard.writeText(textHistory).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0B101B]/95 backdrop-blur-md relative overflow-hidden min-h-0">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }}></div>

      {/* Header */}
      <div className="relative z-10 p-4 md:p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#0F172A] to-transparent shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-god-gold/10 border border-god-gold/20">
            <Book className="w-4 h-4 text-god-gold" />
          </div>
          <div>
            <h2 className="font-display text-god-gold text-lg tracking-[0.15em] leading-none">CHRONICLES</h2>
            <div className="text-[10px] text-slate-500 font-serif italic mt-1">The history of the world</div>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-god-gold transition-colors"
          title="기록 전체 복사"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Log List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 p-4 md:p-5 space-y-8 relative z-10 pb-20 md:pb-5"
      >
        {logs.length === 0 && (
          <div className="text-slate-500 text-center italic mt-20 font-serif opacity-50">
            <Feather className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>페이지가 비어있습니다.<br />아직 시간이 흐르지 않았습니다.</p>
          </div>
        )}

        {logs.map((log, index) => {
          const isLatest = index === logs.length - 1 && logs.length > 1;

          return (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, x: -10, filter: "blur(2px)" }}
              animate={{
                opacity: 1,
                x: 0,
                filter: "blur(0px)",
                textShadow: isLatest ? "0 0 10px rgba(212, 175, 55, 0.5)" : "none"
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`flex flex-col group`}
            >
              <div className="flex items-center gap-3 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="h-px w-4 bg-slate-600"></div>
                <span className="text-[10px] font-mono text-slate-400 tracking-wider">{log.year}년</span>
                <div className="h-px flex-1 bg-slate-800"></div>
                {log.type === LogType.SCRIPTURE && (
                  <span className="text-[9px] uppercase tracking-widest text-god-gold border border-god-gold/30 px-1.5 py-0.5 rounded bg-god-gold/5">Scripture</span>
                )}
              </div>

              {/* Optional Image */}
              {log.imageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="pl-6 mb-3"
                >
                  <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-2xl group-image">
                    <img src={log.imageUrl} alt="Historical depiction" className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-2 right-2 text-[9px] text-slate-400 bg-black/50 backdrop-blur px-2 py-0.5 rounded flex items-center gap-1">
                      <ImageIcon size={10} />
                      <span>Divine Vision</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {log.type === LogType.SCRIPTURE ? (
                <div className="relative pl-6 py-2">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-god-gold to-transparent opacity-60"></div>
                  <motion.p
                    animate={isLatest ? { color: ["#fff", "#D4AF37"] } : {}}
                    transition={{ duration: 1.5 }}
                    className="font-serif text-lg md:text-xl text-god-gold italic leading-relaxed drop-shadow-md"
                  >
                    "<RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />"
                  </motion.p>
                  {log.flavor && <p className="text-xs text-slate-500 text-right mt-2 font-serif tracking-wide">— {log.flavor}</p>}
                </div>
              ) : log.type === LogType.HISTORICAL ? (
                <div className="pl-6 border-l border-slate-700/50 py-1">
                  <motion.p
                    initial={isLatest ? { color: "#ffffff" } : {}}
                    animate={{ color: "#cbd5e1" }} // slate-300
                    transition={{ duration: 2 }}
                    className="font-serif leading-7 text-[15px]"
                  >
                    <RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />
                  </motion.p>
                </div>
              ) : log.type === LogType.CULTURAL ? (
                <div className="pl-6 border-l border-purple-500/20 py-1 bg-gradient-to-r from-purple-900/10 to-transparent rounded-r-lg">
                  <p className="font-sans text-sm text-purple-200 italic font-light">
                    <RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />
                  </p>
                </div>
              ) : log.type === LogType.CHAT ? (
                // Divine Command (User Input) - Centered, Authoritative
                <div className="relative py-4 my-2 group-hover:scale-[1.01] transition-transform duration-500">
                  <div className="flex items-center justify-center gap-4 mb-2 opacity-60">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-god-gold"></div>
                    <span className="text-[10px] text-god-gold uppercase tracking-[0.3em] font-bold">Divine Command</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-god-gold"></div>
                  </div>
                  <p className="text-center font-display font-medium text-lg md:text-xl text-white drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] px-6 leading-relaxed">
                    <RichText content={log.content.replace(/^"|"$/g, '')} keywords={keywords} onLinkClick={onLinkClick} />
                  </p>
                </div>
              ) : log.type === LogType.PETITION ? (
                // Petition (Mortal Prayer) - Minimalist Scripture Style
                <div className="mx-4 md:mx-12 my-6 pl-4 border-l-2 border-slate-700/30 group-hover:border-slate-500/50 transition-colors">
                  <p className="font-serif italic text-slate-300/90 text-lg leading-relaxed">
                    "<RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />"
                  </p>

                  {log.flavor && (
                    <p className="text-right mt-3 text-xs md:text-sm font-serif text-slate-500 tracking-wide">
                      — {log.flavor}
                    </p>
                  )}
                </div>
              ) : log.type === LogType.REVELATION ? (
                // Divine Revelation (Secret Exposed) - Intense, Dramatic
                <div className="relative py-6 my-4 border-y border-red-900/30 bg-gradient-to-r from-transparent via-red-950/20 to-transparent">
                  <div className="flex items-center justify-center gap-3 mb-3 text-red-500/70">
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Divine Truth Revealed</span>
                  </div>
                  <p className="text-center font-serif text-lg md:text-xl text-red-100/90 leading-relaxed italic drop-shadow-[0_2px_10px_rgba(220,38,38,0.4)] px-8">
                    <RichText content={log.content.replace(/^"|"$/g, '')} keywords={keywords} onLinkClick={onLinkClick} />
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900/50 p-3 rounded border border-slate-800 font-mono text-[11px] text-green-500/80">
                  <span className="opacity-70 mr-2">&gt; SYSTEM:</span>
                  <RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />
                </div>
              )}
            </motion.div>
          );
        })}
        <div ref={bottomRef} className="h-px w-full" />
      </div>

      {/* Scroll Button Overlay */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-20"
          >
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-2 px-4 py-2 bg-god-gold/90 text-slate-900 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] font-bold text-xs hover:bg-white transition-all backdrop-blur-md border border-god-gold/50"
            >
              <span>New Chronicles</span>
              <ArrowDown size={14} className="animate-bounce" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default Chronicle;
