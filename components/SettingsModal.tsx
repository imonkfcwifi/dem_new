
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, Music, RotateCcw, User, Tag, Cog } from 'lucide-react';
import { audio } from '../services/audioService';
import { APP_VERSION } from '../constants';

interface SettingsModalProps {
  onClose: () => void;
  onReplayTutorial: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onReplayTutorial }) => {
  const [bgmVolume, setBgmVolume] = useState(audio.getBGMVolume() * 100);
  const [sfxVolume, setSfxVolume] = useState(audio.getSFXVolume() * 100);

  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setBgmVolume(val);
    audio.setBGMVolume(val / 100);
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSfxVolume(val);
    audio.setSFXVolume(val / 100);
    if (val > 0 && val % 10 === 0) audio.playHover(); // Audio feedback while sliding
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#0f172a] border border-god-gold/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative"
      >
        <button 
            onClick={() => { audio.playClick(); onClose(); }}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
            <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-8 text-god-gold">
            <Cog className="animate-spin-slow" size={24} />
            <h2 className="font-display font-bold text-xl tracking-widest">SYSTEM SETTINGS</h2>
        </div>

        <div className="space-y-8">
            {/* Volume Controls */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-2"><Music size={14} /> Background Music</div>
                        <span className="text-god-gold">{bgmVolume}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={bgmVolume} onChange={handleBgmChange}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-god-gold hover:accent-white transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-2"><Volume2 size={14} /> Sound Effects</div>
                        <span className="text-god-gold">{sfxVolume}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={sfxVolume} onChange={handleSfxChange}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-god-gold hover:accent-white transition-all"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/10">
                <button 
                    onClick={() => { audio.playClick(); onReplayTutorial(); }}
                    className="w-full py-3 bg-slate-800/50 hover:bg-slate-700 border border-white/5 hover:border-white/20 rounded-lg text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 group"
                >
                    <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-700" />
                    <span className="text-sm font-bold uppercase tracking-wider">Replay Tutorial</span>
                </button>
            </div>

            {/* Meta Info */}
            <div className="pt-6 border-t border-white/5 flex justify-between items-end text-[10px] text-slate-500 font-mono">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <User size={10} /> Created by <span className="text-slate-300 font-bold">rohdev</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Tag size={10} /> Version <span className="text-slate-300">{APP_VERSION}</span>
                    </div>
                </div>
                <div className="opacity-30">DEUS EX MACHINA</div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
