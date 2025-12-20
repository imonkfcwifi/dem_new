
import React, { useEffect, useState } from 'react';
import { Faction, PastWorld, WorldStats, Person } from '../types';
import { storageService } from '../services/storageService';
import { audio } from '../services/audioService';
import { Scroll, Skull, Trophy, RotateCcw, X, History, Crown, Users, User, BookOpen, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorldHistoryModalProps {
  currentStats?: WorldStats;
  currentFactions?: Faction[];
  currentFigures?: Person[]; // New Prop
  onClose: () => void;
  onResetConfirm: () => void;
}

const WorldHistoryModal: React.FC<WorldHistoryModalProps> = ({ currentStats, currentFactions, currentFigures, onClose, onResetConfirm }) => {
  const [history, setHistory] = useState<PastWorld[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
        const loaded = await storageService.getArchivedWorlds();
        setHistory(loaded);
    };
    loadHistory();
  }, []);

  const handleArchiveAndReset = async () => {
    if (currentStats && currentFactions) {
      setIsArchiving(true);
      const dominant = currentFactions.reduce((prev, current) => (prev.power > current.power) ? prev : current, currentFactions[0]);
      
      const newRecord: PastWorld = {
        id: `world-${Date.now()}`,
        endedAt: Date.now(),
        finalYear: currentStats.year,
        finalPopulation: currentStats.population,
        finalEra: currentStats.technologicalLevel,
        dominantFaction: dominant ? dominant.name : "멸망",
        summary: currentStats.culturalVibe,
        finalFigures: currentFigures || [] // Archive the figures
      };

      try {
        await storageService.archiveWorld(newRecord);
        audio.playDivinePresence();
      } catch (e) {
        console.error("Error during archiving", e);
      }
    }
    // Proceed to reset even if archiving failed to prevent lockup
    onResetConfirm();
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString() + " " + new Date(ts).toLocaleTimeString();
  }

  const selectedWorld = history.find(w => w.id === selectedWorldId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
      <div className="w-full h-full md:h-auto md:max-w-6xl bg-[#0f172a] border-none md:border border-god-gold rounded-none md:rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col md:flex-row overflow-hidden md:max-h-[90vh]">
        
        {/* Left Panel: Stats / End Game Screen */}
        <div className="w-full md:w-1/3 bg-slate-900/50 border-b md:border-b-0 md:border-r border-white/10 flex flex-col relative overflow-hidden shrink-0">
            {currentStats ? (
                // End Game Mode
                <div className="p-6 flex flex-col h-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-god-gold/5 to-transparent pointer-events-none" />
                    <h2 className="text-2xl font-display font-bold text-god-gold mb-1 relative z-10">세계의 종말</h2>
                    <p className="text-slate-500 font-serif italic text-sm mb-6 relative z-10">이 세계의 역사는 여기까지입니다.</p>

                    <div className="space-y-6 relative z-10 flex-1">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total History</div>
                            <div className="text-3xl font-display text-white">{currentStats.year}년</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <Users size={16} className="text-blue-400 mb-2" />
                                <div className="text-[10px] text-slate-500 uppercase">Population</div>
                                <div className="text-lg font-bold text-slate-200">{currentStats.population.toLocaleString()}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <Crown size={16} className="text-god-gold mb-2" />
                                <div className="text-[10px] text-slate-500 uppercase">Era</div>
                                <div className="text-sm font-bold text-slate-200 truncate">{currentStats.technologicalLevel}</div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Final Vibe</div>
                            <p className="text-slate-300 font-serif italic">"{currentStats.culturalVibe}"</p>
                        </div>
                    </div>

                    <div className="mt-6 relative z-10">
                        <button 
                            onClick={handleArchiveAndReset}
                            disabled={isArchiving}
                            className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 border border-red-500/50 hover:border-red-500 text-red-200 rounded-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isArchiving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="font-bold tracking-wider">기록 중...</span>
                                </>
                            ) : (
                                <>
                                    <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-700" />
                                    <span className="font-bold tracking-wider">기록 저장 및 세계 리셋</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                // Archive Viewer Mode
                <div className="p-6 flex flex-col h-full bg-[#050810]">
                     <div className="flex items-center gap-2 text-god-gold mb-6">
                        <History size={24} />
                        <h2 className="text-2xl font-display font-bold">역사의 전당</h2>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                        {history.length === 0 ? (
                            <div className="text-center text-slate-600 italic py-10">기록된 역사가 없습니다.</div>
                        ) : (
                            history.map((world, idx) => (
                                <button
                                    key={world.id}
                                    onClick={() => setSelectedWorldId(world.id)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${selectedWorldId === world.id ? 'bg-god-gold/10 border-god-gold text-god-gold' : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold">World #{history.length - idx}</span>
                                        <span className="text-[10px] opacity-60">{new Date(world.endedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs opacity-80">
                                        <span>{world.finalYear}년 존속</span>
                                        <span>•</span>
                                        <span>{world.dominantFaction}</span>
                                    </div>
                                </button>
                            ))
                        )}
                     </div>
                     
                     <div className="pt-4 mt-4 border-t border-white/10">
                         <button onClick={() => onClose()} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-white/10">
                             닫기
                         </button>
                     </div>
                </div>
            )}
        </div>

        {/* Right Panel: Content */}
        <div className="flex-1 bg-[#0f172a] h-full overflow-hidden flex flex-col">
             {selectedWorld ? (
                 <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in">
                     <div className="p-6 border-b border-white/10 bg-slate-900/80">
                         <h3 className="text-xl font-display font-bold text-god-gold mb-1">World Archive #{selectedWorld.id.slice(-4)}</h3>
                         <div className="flex gap-4 text-xs text-slate-400 font-mono">
                             <span>Final Year: {selectedWorld.finalYear}</span>
                             <span>Population: {selectedWorld.finalPopulation.toLocaleString()}</span>
                             <span>Era: {selectedWorld.finalEra}</span>
                         </div>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                         {/* Heroes Section */}
                         <div className="mb-8">
                             <h4 className="flex items-center gap-2 text-white font-bold mb-4 border-b border-white/10 pb-2">
                                <Users size={18} className="text-god-gold" />
                                <span>위인 열전 (Figures of the Era)</span>
                             </h4>
                             
                             {selectedWorld.finalFigures && selectedWorld.finalFigures.length > 0 ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {selectedWorld.finalFigures.map(fig => (
                                         <div key={fig.id} className="bg-slate-800/30 rounded-lg p-3 border border-white/5 flex gap-3 items-start">
                                             <div className="w-12 h-12 rounded bg-slate-900 border border-white/10 shrink-0 overflow-hidden">
                                                 {fig.portraitUrl ? (
                                                     <img src={fig.portraitUrl} alt={fig.name} className="w-full h-full object-cover opacity-80" />
                                                 ) : (
                                                     <div className="w-full h-full flex items-center justify-center text-slate-600"><User size={20} /></div>
                                                 )}
                                             </div>
                                             <div>
                                                 <div className="text-slate-200 font-bold text-sm">{fig.name}</div>
                                                 <div className="text-god-gold text-xs italic">{fig.role}</div>
                                                 <div className="text-slate-500 text-[10px] mt-1 line-clamp-2">{fig.description}</div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="text-slate-500 italic text-sm">기록된 인물이 없습니다.</div>
                             )}
                         </div>

                         {/* Summary Section */}
                         <div>
                             <h4 className="flex items-center gap-2 text-white font-bold mb-4 border-b border-white/10 pb-2">
                                <BookOpen size={18} className="text-god-gold" />
                                <span>시대의 분위기 (Zeitgeist)</span>
                             </h4>
                             <p className="text-slate-400 font-serif italic leading-relaxed">
                                 "{selectedWorld.summary}"
                             </p>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50 p-10 text-center">
                     <History size={64} className="mb-4" />
                     <p>좌측에서 기록을 선택하여<br/>과거의 영광을 확인하십시오.</p>
                 </div>
             )}
             
             {/* Mobile Close Button Overlay */}
             <button 
                onClick={onClose}
                className="md:hidden absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white z-50"
             >
                <X size={20} />
             </button>
        </div>

      </div>
    </div>
  );
};

export default WorldHistoryModal;
