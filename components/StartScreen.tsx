
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Key, Bot, ChevronRight, CheckCircle, X, ImageOff, Cog } from 'lucide-react';
import { initializeAI, AIProvider } from '../services/geminiService';
import { audio } from '../services/audioService';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini');
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);

  // Load saved key/provider on mount
  useEffect(() => {
    const savedProvider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
    setSelectedProvider(savedProvider);
    
    const keyKey = savedProvider === 'gemini' ? 'user_gemini_api_key' : 'user_claude_api_key';
    const savedKey = localStorage.getItem(keyKey);
    
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeyValid(true);
    } else {
      setApiKey('');
      setIsKeyValid(null);
    }
  }, []);

  // Update input field when provider changes
  useEffect(() => {
    const keyKey = selectedProvider === 'gemini' ? 'user_gemini_api_key' : 'user_claude_api_key';
    const savedKey = localStorage.getItem(keyKey) || '';
    setApiKey(savedKey);
    setIsKeyValid(!!savedKey);
  }, [selectedProvider]);

  const handleStartGame = () => {
    audio.playClick();
    
    // Initialize AI with current config
    const success = initializeAI(apiKey, selectedProvider);
    
    // Validate
    if (apiKey && !success) {
        setIsKeyValid(false);
        return;
    }
    
    onStart();
  };

  const handleSaveSettings = () => {
    audio.playClick();
    const success = initializeAI(apiKey, selectedProvider);
    
    if (success) {
        setShowSettings(false);
        setIsKeyValid(true);
    } else {
        setIsKeyValid(false);
    }
  };

  const handleClearKey = () => {
      setApiKey('');
      const keyKey = selectedProvider === 'gemini' ? 'user_gemini_api_key' : 'user_claude_api_key';
      localStorage.removeItem(keyKey);
      setIsKeyValid(null);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
         {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-god-gold rounded-full opacity-20"
              initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, scale: 0 }}
              animate={{ y: [null, Math.random() * -100], opacity: [0, 0.5, 0] }}
              transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
              style={{ width: Math.random() * 3 + 'px', height: Math.random() * 3 + 'px' } as any}
            />
         ))}
      </div>

      {/* Main Title Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center px-6"
      >
        <div className="mb-6 p-4 rounded-full border border-god-gold/20 bg-god-gold/5 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
             <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
             >
                <div className="w-16 h-16 border-2 border-god-gold rotate-45" />
             </motion.div>
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-god-gold via-[#fcd34d] to-[#78350f] tracking-[0.2em] mb-4 drop-shadow-lg">
          DEUS EX
          <span className="block text-2xl md:text-3xl mt-2 tracking-[0.5em] opacity-80 text-god-gold/60">MACHINA</span>
        </h1>

        <p className="text-slate-400 font-serif italic max-w-md mb-12 leading-relaxed whitespace-pre-line">
          {`"침묵하는 신이 되어 역사를 지켜보소서. \n 당신의 한 마디가 경전이 되고, 침묵이 곧 심판이 되나이다."`}
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
                onClick={handleStartGame}
                className="group relative px-8 py-4 bg-god-gold/10 hover:bg-god-gold/20 border border-god-gold/50 rounded-lg transition-all duration-300 overflow-hidden"
            >
                <div className="absolute inset-0 bg-god-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="flex items-center justify-center gap-3 text-god-gold font-display font-bold tracking-widest uppercase">
                    <span>Enter World</span>
                    <Play size={16} fill="currentColor" />
                </div>
            </button>

            <button 
                onClick={() => { audio.playClick(); setShowSettings(true); }}
                className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 text-xs uppercase tracking-widest py-2 transition-colors"
            >
                <Cog size={12} />
                <span>Neural Configuration</span>
            </button>
        </div>
      </motion.div>

      <div className="absolute bottom-6 text-[10px] text-slate-600 font-mono">
        v1.1.3.1208 • Created by devroh horved
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-2xl p-6 shadow-2xl relative"
                >
                    <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                        <X size={20} />
                    </button>

                    <h2 className="text-xl font-display text-slate-200 mb-6 flex items-center gap-2">
                        <Bot size={20} className="text-god-gold" />
                        AI Model Configuration
                    </h2>

                    <div className="space-y-6">
                        
                        {/* Model Selector */}
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold">Inference Engine</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => { audio.playClick(); setSelectedProvider('gemini'); }}
                                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${selectedProvider === 'gemini' ? 'bg-god-gold/10 border-god-gold text-god-gold' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                >
                                    <span className="font-bold text-sm">Gemini</span>
                                    <span className="text-[9px]">Flash 2.5</span>
                                </button>
                                <button 
                                    onClick={() => { audio.playClick(); setSelectedProvider('claude'); }}
                                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${selectedProvider === 'claude' ? 'bg-god-gold/10 border-god-gold text-god-gold' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                >
                                    <span className="font-bold text-sm">Claude</span>
                                    <span className="text-[9px]">Haiku 3.5</span>
                                </button>
                                <button 
                                    disabled
                                    className="p-3 rounded-lg border bg-slate-900 border-slate-800 text-slate-600 flex flex-col items-center gap-1 opacity-40 cursor-not-allowed"
                                >
                                    <span className="font-bold text-sm">GPT-4o</span>
                                    <span className="text-[9px]">Soon</span>
                                </button>
                            </div>
                        </div>

                        {/* API Key Input */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                                    {selectedProvider === 'gemini' ? 'Gemini API Key' : 'Anthropic API Key'}
                                </label>
                                {isKeyValid && <span className="text-green-500 flex items-center gap-1 text-[10px]"><CheckCircle size={10} /> Saved</span>}
                            </div>
                            
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <Key size={16} />
                                </div>
                                <input 
                                    type="password" 
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={selectedProvider === 'gemini' ? "Paste Gemini API Key" : "Paste sk-ant-..."}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-10 text-slate-200 focus:outline-none focus:border-god-gold focus:ring-1 focus:ring-god-gold/50 placeholder-slate-600 font-mono text-sm"
                                />
                                {apiKey && (
                                    <button onClick={handleClearKey} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            
                            {selectedProvider === 'claude' && (
                                <div className="flex items-center gap-2 text-[10px] text-orange-400/80 bg-orange-900/20 p-2 rounded border border-orange-500/20">
                                    <ImageOff size={12} />
                                    <span>Image generation is not supported by Claude Haiku.</span>
                                </div>
                            )}

                            <p className="text-[10px] text-slate-500 leading-tight">
                                * Keys are stored locally in your browser.
                                {selectedProvider === 'claude' && <span className="block mt-1 text-slate-400">* Note: Claude API might require a proxy or disable CORS in some environments.</span>}
                            </p>
                        </div>

                        <button 
                            onClick={handleSaveSettings}
                            className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <span>Confirm Configuration</span>
                            <ChevronRight size={16} />
                        </button>

                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StartScreen;
