
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Faction, LogEntry, Person, Secret } from '../types';
import { FACTION_LORE_DATA } from '../constants';
import { audio } from '../services/audioService';
import { X, BookOpen, Book, Scroll, Users, MessageSquare, Shield, History, Skull, AlertCircle, TrendingUp, TrendingDown, Crown, User, Star, Cross, Loader2, Zap, Search, Eye, Lock, FileText, ArrowLeft, Megaphone, Flag, ChevronLeft, EyeOff, Check, Network, List as ListIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RichText from './RichText';

interface LoreModalProps {
  factions: Faction[];
  figures: Person[];
  logs: LogEntry[];
  keywords: string[]; // Expanded list
  initialFaction?: string | null;
  queuedSecretIds: Set<string>; // New prop: active queued secret IDs
  onClose: () => void;
  onLinkClick: (keyword: string) => void;
  onRequestPortrait: (personId: string) => void;
  onRevealSecret?: (secret: Secret, personName: string) => void;
}

// History Stack Item Definition
type HistoryItem = 
  | { type: 'list' }
  | { type: 'faction'; name: string }
  | { type: 'person'; id: string };

const RelationshipGraph = ({ centerFigure, allFigures, onNavigate }: { centerFigure: Person, allFigures: Person[], onNavigate: (id: string) => void }) => {
  const rels = centerFigure.relationships;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.0);

  // Wheel Zoom Logic
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
        // Prevent default only if we are actually zooming (optional, but good for map feel)
        e.preventDefault();
        e.stopPropagation();

        const delta = -e.deltaY * 0.001; // Sensitivity
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3.0));
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleZoomIn = () => {
      audio.playClick();
      setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
      audio.playClick();
      setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
      audio.playClick();
      setScale(1.0);
  };

  if (rels.length === 0) return <div className="text-center py-20 text-slate-600 italic">No connections recorded.</div>;

  // LOD: Hide text labels when zoomed out to reduce clutter
  const showDetail = scale >= 0.8;

  return (
      <div 
        ref={containerRef} 
        className="relative w-full h-[320px] md:h-[400px] bg-[#0b1120] rounded-xl border border-white/5 overflow-hidden shadow-inner group select-none mt-2"
      >
          {/* Controls */}
          <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-1 pointer-events-auto">
             <button onClick={handleZoomIn} className="p-1.5 bg-slate-900/80 border border-slate-700 rounded-t text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Zoom In"><ZoomIn size={16}/></button>
             <button onClick={handleReset} className="p-1.5 bg-slate-900/80 border-x border-b border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Reset View"><RotateCcw size={16}/></button>
             <button onClick={handleZoomOut} className="p-1.5 bg-slate-900/80 border-x border-b border-slate-700 rounded-b text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Zoom Out"><ZoomOut size={16}/></button>
          </div>

          {/* Background Grid */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
          />
          
          <motion.div
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            animate={{ scale }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute w-full h-full origin-center cursor-grab active:cursor-grabbing"
            // Set canvas to 200% to allow ample panning space. 
            // -50% translation centers the 200% canvas in the 100% container.
            style={{ width: '200%', height: '200%', top: '-50%', left: '-50%' } as any}
          >
              {/* Connecting Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {rels.map((rel, i) => {
                      const angle = (i / rels.length) * 2 * Math.PI - Math.PI / 2;
                      // Adjusted radius for 200% canvas (18% of 200% ~= 36% of original)
                      const r = 18; 
                      const x2 = 50 + r * Math.cos(angle);
                      const y2 = 50 + r * Math.sin(angle);
                      
                      const color = rel.isSecret ? '#a855f7' : (rel.value > 20 ? '#3b82f6' : (rel.value < -20 ? '#ef4444' : '#64748b'));
                      
                      return (
                          <motion.line
                              key={`line-${i}`}
                              x1="50" y1="50"
                              x2={x2} y2={y2}
                              stroke={color}
                              strokeWidth={rel.isSecret ? 0.15 : 0.25} // Thinner lines for larger canvas
                              strokeDasharray={rel.isSecret ? "1 1" : "none"}
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 0.6 }}
                              transition={{ duration: 0.5, delay: i * 0.1 }}
                          />
                      );
                  })}
              </svg>

              {/* Center Node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
                  <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-16 h-16 rounded-full border-2 border-god-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] overflow-hidden bg-slate-800 relative z-10"
                  >
                       {centerFigure.portraitUrl ? <img src={centerFigure.portraitUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-500" />}
                  </motion.div>
                  <motion.span 
                    animate={{ opacity: showDetail ? 1 : 0, y: showDetail ? 0 : -5 }}
                    className="mt-2 text-[10px] font-bold text-god-gold bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm shadow-md whitespace-nowrap z-20"
                  >
                    {centerFigure.name}
                  </motion.span>
              </div>

              {/* Satellite Nodes */}
              {rels.map((rel, i) => {
                  const targetPerson = allFigures.find(p => p.id === rel.targetId || p.name === rel.targetName);
                  const angle = (i / rels.length) * 2 * Math.PI - Math.PI / 2;
                  const r = 18; // Match line radius
                  const x = 50 + r * Math.cos(angle);
                  const y = 50 + r * Math.sin(angle);
                  
                  return (
                      <motion.div
                          key={`node-${i}`}
                          className="absolute z-30 flex flex-col items-center cursor-pointer group/node"
                          style={{ left: `${x}%`, top: `${y}%` }} 
                          // IMPORTANT: Use x/y props for transform to play nicely with scale animation
                          initial={{ scale: 0, opacity: 0, x: "-50%", y: "-50%" }}
                          animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
                          transition={{ duration: 0.4, delay: 0.2 + (i * 0.05) }}
                          onClick={() => targetPerson && onNavigate(targetPerson.id)}
                      >
                          {/* Avatar */}
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border bg-slate-800 overflow-hidden transition-all duration-300 group-hover/node:scale-110 group-hover/node:border-white shadow-lg relative
                              ${rel.value > 20 ? 'border-blue-500/50' : rel.value < -20 ? 'border-red-500/50' : 'border-slate-500/50'}
                              ${rel.isSecret ? 'ring-2 ring-purple-500/30' : ''}
                          `}>
                              {targetPerson?.portraitUrl ? (
                                  <img src={targetPerson.portraitUrl} className="w-full h-full object-cover opacity-90 group-hover/node:opacity-100" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900"><User size={20} /></div>
                              )}
                              
                              {/* Status Indicator overlay if dead */}
                              {targetPerson?.status === 'Dead' && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <Cross size={12} className="text-white/70" />
                                  </div>
                              )}
                          </div>

                          {/* Label - Respects LOD */}
                          <motion.div 
                             animate={{ opacity: showDetail ? 1 : 0.5, scale: showDetail ? 1 : 0.8 }}
                             className="absolute top-full mt-2 flex flex-col items-center whitespace-nowrap z-50"
                          >
                              {showDetail && (
                                  <span className="text-[10px] font-bold text-slate-200 bg-black/80 border border-white/10 px-2 py-1 rounded shadow-xl pointer-events-none mb-1">
                                    {rel.targetName}
                                  </span>
                              )}
                              {/* Show type icon/text only on hover if zoomed out, or always if zoomed in? 
                                  Let's only show detailed type info on hover or high zoom.
                              */}
                              <span className={`text-[9px] px-1.5 py-px rounded border shadow-lg transition-opacity ${showDetail ? 'opacity-100' : 'opacity-0 group-hover/node:opacity-100'}
                                  ${rel.isSecret ? 'bg-purple-900/80 text-purple-300 border-purple-500/30' : 'bg-slate-900/80 text-slate-400 border-slate-700'}`}>
                                  {rel.type}
                              </span>
                          </motion.div>
                      </motion.div>
                  );
              })}
          </motion.div>
      </div>
  );
};

const LoreModal: React.FC<LoreModalProps> = ({ factions, figures, logs, keywords, initialFaction, queuedSecretIds, onClose, onLinkClick, onRequestPortrait, onRevealSecret }) => {
  // Navigation Stack State
  const [historyStack, setHistoryStack] = useState<HistoryItem[]>([{ type: 'list' }]);
  
  const [activeTab, setActiveTab] = useState<'lore' | 'history'>('lore');
  const [activePersonTab, setActivePersonTab] = useState<'profile' | 'relationships' | 'secrets'>('profile');
  const [relationshipView, setRelationshipView] = useState<'graph' | 'list'>('graph');
  
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const logRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Track secrets currently being revealed/queued locally before prop updates
  const [processingSecrets, setProcessingSecrets] = useState<Set<string>>(new Set());

  // Reset processing state when logs update (implying turn finished)
  useEffect(() => {
      if (processingSecrets.size > 0) {
          setProcessingSecrets(new Set());
      }
  }, [logs]);

  // Initialization: Push initial link to stack if present
  useEffect(() => {
    if (initialFaction) {
        // Check if it matches a faction
        const isFaction = factions.some(f => f.name === initialFaction);
        if (isFaction) {
            setHistoryStack([{ type: 'list' }, { type: 'faction', name: initialFaction }]);
        } else {
            // Check if it matches a person (initialFaction here is just a name string passed from onLinkClick)
            const person = figures.find(p => p.name === initialFaction);
            if (person) {
                setHistoryStack([{ type: 'list' }, { type: 'person', id: person.id }]);
            } else {
                // Fallback: If unknown, maybe it was a faction name that didn't match exactly?
                // Just try to treat as faction name
                setHistoryStack([{ type: 'list' }, { type: 'faction', name: initialFaction }]);
            }
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFaction]); 

  // Derived State from Stack
  const currentView = historyStack[historyStack.length - 1];
  const isListView = currentView.type === 'list';
  const selectedFactionName = currentView.type === 'faction' ? currentView.name 
                            : currentView.type === 'person' ? figures.find(p => p.id === currentView.id)?.factionName 
                            : null;
  const selectedFigureId = currentView.type === 'person' ? currentView.id : null;
  const selectedFigure = figures.find(p => p.id === selectedFigureId);
  const selectedFaction = factions.find(f => f.name === selectedFactionName);

  // Trigger portrait generation if viewing a figure without one
  useEffect(() => {
      if (selectedFigure && !selectedFigure.portraitUrl) {
          onRequestPortrait(selectedFigure.id);
      }
  }, [selectedFigure, onRequestPortrait]);

  // Highlight Log Scroll
  useEffect(() => {
      if (highlightedLogId && activePersonTab === 'profile') {
          const el = logRefs.current.get(highlightedLogId);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const timer = setTimeout(() => setHighlightedLogId(null), 2000);
              return () => clearTimeout(timer);
          }
      }
  }, [highlightedLogId, activePersonTab]);
  
  // DYNAMIC LORE LOGIC: Use static data first, fallback to dynamic faction data
  const loreData = useMemo(() => {
      if (!selectedFactionName) return null;
      
      const staticData = FACTION_LORE_DATA[selectedFactionName];
      if (staticData) return staticData;

      // If no static data (New Faction), create dynamic structure
      if (selectedFaction) {
          return {
              description: selectedFaction.description || `${selectedFactionName}은(는) 새로운 시대의 흐름 속에 등장한 세력입니다.`,
              history: selectedFaction.history || "이 세력의 기원에 대한 기록은 아직 희미하지만, 그들의 영향력은 점차 확대되고 있습니다.",
              beliefs: selectedFaction.tenets || ["알려지지 않은 신념"],
              initialFigures: [] // Dynamic factions don't have hardcoded initial figures
          };
      }
      return null;
  }, [selectedFactionName, selectedFaction]);

  // Filter available keywords for linking (exclude current title)
  const availableKeywords = useMemo(() => {
    const currentName = selectedFigure ? selectedFigure.name : selectedFactionName;
    return keywords.filter(k => k !== currentName);
  }, [keywords, selectedFigure, selectedFactionName]);

  // Filtered Logs
  const factionHistory = useMemo(() => {
    if (!selectedFactionName) return [];
    return logs.filter(log => log.content.includes(selectedFactionName));
  }, [selectedFactionName, logs]);

  const personHistory = useMemo(() => {
      if (!selectedFigure) return [];
      return logs.filter(log => log.content.includes(selectedFigure.name));
  }, [selectedFigure, logs]);

  // --- Navigation Handlers ---

  const navigateTo = (item: HistoryItem) => {
      audio.playClick();
      setHistoryStack(prev => [...prev, item]);
      setActiveTab('lore'); // Reset tabs on nav
      setActivePersonTab('profile');
      setRelationshipView('graph'); // Reset to graph view
  };

  const handleBack = () => {
      audio.playClick();
      if (historyStack.length > 1) {
          setHistoryStack(prev => prev.slice(0, -1));
      } else {
          // If at root (list), close modal
          onClose();
      }
  };

  // Helper for internal links
  const handleInternalLinkClick = (keyword: string) => {
      // Check if faction
      const isFaction = factions.some(f => f.name === keyword);
      if (isFaction) {
          navigateTo({ type: 'faction', name: keyword });
          return;
      }
      // Check if person
      const person = figures.find(p => p.name === keyword);
      if (person) {
          navigateTo({ type: 'person', id: person.id });
          return;
      }
      // If external/generic, use main app handler (might close modal or do nothing)
      onLinkClick(keyword);
  };

  const handleJumpToLog = (logId: string) => {
      audio.playClick();
      setActivePersonTab('profile');
      setTimeout(() => setHighlightedLogId(logId), 100);
  };

  const findRelatedLog = (secretText: string) => {
    const yearMatch = secretText.match(/Year (\d+)/i) || secretText.match(/(\d+)년/);
    if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        return personHistory.find(l => l.year === year);
    }
    return null;
  };

  const isFallen = selectedFaction ? selectedFaction.power <= 0 : false;
  
  const getDynamicStatus = (f: Faction) => {
    if (f.power <= 0) return { text: "이 세력은 역사의 뒤안길로 사라졌으며, 이제는 폐허와 기록으로만 남아있습니다.", icon: Skull, color: "text-slate-500" };
    if (f.power >= 80) return { text: "현재 이 세력은 대륙을 호령하는 절대적인 지배자로서 전성기를 누리고 있습니다.", icon: Crown, color: "text-god-gold" };
    if (f.power >= 50) return { text: "강력한 영향력을 행사하며 문명의 주축을 담당하고 있습니다.", icon: TrendingUp, color: "text-blue-400" };
    if (f.power <= 20) return { text: "쇠락의 길을 걷고 있으며, 존망의 위기에 처해 있습니다.", icon: TrendingDown, color: "text-red-400" };
    return { text: "자신들의 영토에서 묵묵히 역사를 써내려가고 있습니다.", icon: Shield, color: "text-slate-400" };
  };

  const dynamicStatus = selectedFaction ? getDynamicStatus(selectedFaction) : null;
  
  // Separate figures into living and dead
  const factionFigures = useMemo(() => {
      if (!selectedFactionName) return { alive: [], dead: [] };
      const all = figures.filter(f => f.factionName === selectedFactionName);
      return {
          alive: all.filter(f => f.status !== 'Dead'),
          dead: all.filter(f => f.status === 'Dead')
      };
  }, [selectedFactionName, figures]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Main Container */}
      <div className="relative w-full h-full md:h-[90vh] md:max-w-6xl bg-[#0f172a] border-none md:border border-god-gold/30 md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Mobile Header (Only visible on mobile) */}
        <div className="md:hidden p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/95 z-20 shrink-0 shadow-lg">
          <button onClick={handleBack} className="flex items-center gap-1 text-god-gold pr-2 active:scale-95 transition-transform">
             <ChevronLeft size={24} />
             <span className="font-display font-bold text-lg">{historyStack.length > 1 ? 'Back' : 'Close'}</span>
          </button>
          
          <div className="text-sm font-display font-bold text-slate-200 truncate max-w-[200px]">
             {selectedFigure ? selectedFigure.name : selectedFactionName || "Archives"}
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Sidebar (Desktop Only) - Always shows List View */}
        <div className="hidden md:flex w-1/4 bg-slate-900/50 border-r border-white/5 flex-col h-full overflow-hidden shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center gap-2 text-god-gold">
             <BookOpen size={20} />
             <h2 className="font-display text-xl font-bold tracking-widest">ARCHIVES</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
             {factions.map(f => (
                 <button
                    key={f.name}
                    onClick={() => navigateTo({ type: 'faction', name: f.name })}
                    className={`w-full text-left p-3 rounded-lg transition-all border flex items-center justify-between group
                      ${selectedFactionName === f.name ? 'bg-god-gold/10 border-god-gold/30 text-god-gold' : 
                        f.power <= 0 ? 'bg-red-900/10 border-red-900/20 text-red-800 hover:bg-red-900/20' :
                        'border-transparent text-slate-400 hover:bg-white/5'}`}
                 >
                    <div className="flex items-center gap-3">
                       {f.power <= 0 ? (
                           <Skull size={14} className="text-red-700/70" />
                       ) : (
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                       )}
                       <span className={`font-serif text-sm ${selectedFactionName === f.name ? 'font-bold' : ''}`}>{f.name}</span>
                    </div>
                    {f.power <= 0 && <span className="text-[9px] uppercase font-bold text-red-900/50">Fallen</span>}
                 </button>
             ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-gradient-to-br from-[#0f172a] to-[#020617] relative flex flex-col h-full overflow-hidden">
            
            {/* Desktop Close Button */}
            <button 
                onClick={onClose}
                className="hidden md:block absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
            >
                <X size={24} />
            </button>

            {/* Desktop Back / Breadcrumb Nav */}
            <div className="hidden md:flex absolute top-4 left-4 z-20 items-center gap-2">
               {historyStack.length > 1 && (
                 <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-god-gold/30 text-god-gold hover:bg-god-gold hover:text-slate-900 transition-all text-xs uppercase font-bold tracking-widest shadow-lg"
                 >
                    <ArrowLeft size={14} />
                    <span>Back ({historyStack.length - 1})</span>
                 </button>
               )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-0">
                <AnimatePresence mode="wait">
                    
                    {/* === VIEW: LIST (Mobile Only State) === */}
                    {isListView ? (
                        <motion.div 
                            key="list-mobile"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="md:hidden p-4 space-y-2"
                        >
                            <h2 className="text-god-gold font-display text-xl mb-4 border-b border-white/10 pb-2">Select a Faction</h2>
                            {factions.map(f => (
                                <button
                                    key={f.name}
                                    onClick={() => navigateTo({ type: 'faction', name: f.name })}
                                    className={`w-full p-4 rounded-lg border flex items-center justify-between active:scale-95 transition-transform
                                        ${f.power <= 0 ? 'bg-red-900/10 border-red-900/30' : 'bg-slate-800/50 border-white/5'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: f.power <= 0 ? '#555' : f.color }} />
                                        <span className={`font-serif font-bold ${f.power <= 0 ? 'text-red-400' : 'text-slate-200'}`}>{f.name}</span>
                                    </div>
                                    {f.power <= 0 && <Skull size={16} className="text-red-500" />}
                                </button>
                            ))}
                        </motion.div>
                    ) : 
                    
                    /* === VIEW: PERSON PROFILE === */
                    selectedFigure ? (
                        <motion.div
                            key={`person-${selectedFigure.id}`}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="p-4 md:p-10 pt-16 md:pt-16 flex flex-col md:flex-row gap-8 min-h-min"
                        >
                             {/* Left: Portrait & Stats */}
                             <div className="w-full md:w-1/3 flex flex-col gap-4 flex-shrink-0">
                                <div className={`aspect-[3/4] bg-slate-900 rounded-xl border border-white/10 relative overflow-hidden shadow-2xl group flex-shrink-0 ${selectedFigure.status === 'Dead' ? 'grayscale' : ''}`}>
                                     {selectedFigure.portraitUrl ? (
                                         <motion.img 
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            src={selectedFigure.portraitUrl} alt={selectedFigure.name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                         />
                                     ) : (
                                         <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                             <Loader2 size={32} className="text-god-gold animate-spin opacity-50" />
                                             <span className="text-[10px] text-slate-500 uppercase">Generating Visage...</span>
                                         </div>
                                     )}
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                     <div className="absolute bottom-4 left-4 right-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className={`text-2xl font-display font-bold leading-tight ${selectedFigure.status === 'Dead' ? 'text-slate-400 decoration-slate-600 line-through decoration-2' : 'text-slate-100'}`}>{selectedFigure.name}</h2>
                                            {selectedFigure.status === 'Dead' && <Cross size={18} className="text-red-500" />}
                                        </div>
                                        <p className="text-god-gold font-serif italic text-sm">{selectedFigure.role}</p>
                                     </div>
                                </div>
                                
                                {/* Info Card with BIG Faction Button */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest">Allegiance</span>
                                        <button 
                                            onClick={() => navigateTo({ type: 'faction', name: selectedFigure.factionName })}
                                            className="w-full mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-god-gold/20 hover:to-god-gold/10 border border-god-gold/30 hover:border-god-gold text-slate-200 hover:text-god-gold py-3 rounded-lg transition-all group shadow-md"
                                        >
                                            <Flag size={14} className="group-hover:rotate-12 transition-transform" />
                                            <span className="font-bold">{selectedFigure.factionName}</span>
                                        </button>
                                    </div>

                                    <div className="flex justify-between text-sm border-t border-white/5 pt-3">
                                        <span className="text-slate-500">Birth</span>
                                        <span className="text-slate-300">{selectedFigure.birthYear > 0 ? `Year ${selectedFigure.birthYear}` : 'Pre-History'}</span>
                                    </div>
                                    {selectedFigure.deathYear && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Death</span>
                                            <span className="text-red-400 font-bold flex items-center gap-1"><Cross size={10} /> Year {selectedFigure.deathYear}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {selectedFigure.traits.map(t => (
                                            <span key={t} className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-white/5">{t}</span>
                                        ))}
                                    </div>
                                </div>
                             </div>

                             {/* Right: Content Tabs */}
                             <div className="flex-1 flex flex-col">
                                <div className="flex gap-2 mb-4 p-1 bg-slate-900/80 rounded-lg border border-white/5 overflow-x-auto">
                                     {['profile', 'relationships', 'secrets'].map(tab => (
                                         <button 
                                            key={tab}
                                            onClick={() => setActivePersonTab(tab as any)}
                                            className={`flex-1 py-2 px-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activePersonTab === tab ? 'bg-god-gold text-slate-900' : 'text-slate-500 hover:text-slate-300'}`}
                                         >
                                            {tab}
                                         </button>
                                     ))}
                                </div>
                                
                                <div className="flex-1 md:overflow-y-auto scrollbar-hide">
                                    {activePersonTab === 'profile' && (
                                        <div className="space-y-6">
                                            <p className="text-slate-300 font-serif leading-relaxed text-lg italic opacity-90 border-l-2 border-god-gold/30 pl-4">
                                                "{selectedFigure.description}"
                                            </p>
                                            <div className="prose prose-invert text-sm text-slate-400">
                                                <RichText content={selectedFigure.biography} keywords={availableKeywords} onLinkClick={handleInternalLinkClick} />
                                            </div>
                                            <div className="space-y-3 pt-4">
                                                <h3 className="text-god-gold font-display text-sm border-b border-god-gold/20 pb-1">Life Chronicle</h3>
                                                {personHistory.map(log => (
                                                    <div key={log.id} ref={el => { if(el) logRefs.current.set(log.id, el) }} className={`text-sm text-slate-400 border-l border-slate-700 pl-4 py-1 ${highlightedLogId === log.id ? 'bg-white/10' : ''}`}>
                                                        <span className="font-mono text-xs text-slate-600 block mb-1">Year {log.year}</span>
                                                        <RichText content={log.content} keywords={availableKeywords} onLinkClick={handleInternalLinkClick} />
                                                    </div>
                                                ))}
                                                {personHistory.length === 0 && <p className="text-slate-600 italic text-xs">No records yet.</p>}
                                            </div>
                                        </div>
                                    )}

                                    {activePersonTab === 'relationships' && (
                                        <div className="flex flex-col gap-3">
                                            {/* View Toggle */}
                                            <div className="flex justify-end">
                                                <div className="flex p-0.5 bg-slate-900 rounded-lg border border-white/10">
                                                    <button 
                                                        onClick={() => { audio.playClick(); setRelationshipView('graph'); }}
                                                        className={`p-1.5 rounded-md transition-all ${relationshipView === 'graph' ? 'bg-god-gold/20 text-god-gold shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                                        title="Graph View"
                                                    >
                                                        <Network size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => { audio.playClick(); setRelationshipView('list'); }}
                                                        className={`p-1.5 rounded-md transition-all ${relationshipView === 'list' ? 'bg-god-gold/20 text-god-gold shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                                        title="List View"
                                                    >
                                                        <ListIcon size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Graph View */}
                                            {relationshipView === 'graph' && (
                                                <RelationshipGraph 
                                                    centerFigure={selectedFigure} 
                                                    allFigures={figures} 
                                                    onNavigate={(id) => navigateTo({ type: 'person', id })} 
                                                />
                                            )}

                                            {/* List View */}
                                            {relationshipView === 'list' && (
                                                <div className="grid gap-3">
                                                    {selectedFigure.relationships.map((rel, idx) => (
                                                        <div key={idx} className={`p-4 rounded-lg border flex flex-col gap-2 ${rel.isSecret ? 'bg-purple-900/10 border-purple-500/30' : 'bg-slate-900/50 border-white/5'}`}>
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => {
                                                                        const target = figures.find(p => p.id === rel.targetId || p.name === rel.targetName);
                                                                        if(target) navigateTo({ type: 'person', id: target.id });
                                                                    }} className="text-slate-200 font-bold hover:text-god-gold underline decoration-slate-700 underline-offset-4">
                                                                        {rel.targetName}
                                                                    </button>
                                                                    {rel.isSecret && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                                                            <EyeOff size={8} /> SECRET
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded border ${rel.value > 0 ? 'text-blue-300 border-blue-900 bg-blue-900/20' : 'text-red-300 border-red-900 bg-red-900/20'}`}>{rel.type}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 italic">"{rel.description}"</p>
                                                        </div>
                                                    ))}
                                                    {selectedFigure.relationships.length === 0 && (
                                                        <div className="text-center py-10 text-slate-600 italic">No known associates.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activePersonTab === 'secrets' && (
                                        <div className="space-y-4">
                                            {selectedFigure.secrets.map(secret => {
                                                const relatedLog = findRelatedLog(secret.description);
                                                const isProcessing = processingSecrets.has(secret.id);
                                                const isQueued = queuedSecretIds.has(secret.id) || isProcessing;
                                                
                                                return (
                                                    <div key={secret.id} className="bg-[#1a0f0f] border border-red-900/30 p-4 rounded-lg relative overflow-hidden group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 text-red-400">
                                                                <Lock size={14} />
                                                                <span className="text-xs font-mono font-bold uppercase">{secret.severity}</span>
                                                            </div>
                                                            {onRevealSecret && (
                                                                <button 
                                                                    onClick={() => {
                                                                        if (onRevealSecret && !isQueued) {
                                                                            setProcessingSecrets(prev => new Set(prev).add(secret.id));
                                                                            onRevealSecret(secret, selectedFigure.name);
                                                                            // Removed onClose() to prevent window disappearing
                                                                        }
                                                                    }}
                                                                    disabled={isQueued}
                                                                    className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors shadow-[0_0_10px_rgba(212,175,55,0.2)] 
                                                                        ${isQueued 
                                                                            ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed shadow-none' 
                                                                            : 'bg-god-gold/10 hover:bg-god-gold/20 text-god-gold border-god-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]'}`}
                                                                >
                                                                    {isQueued ? (
                                                                        <>
                                                                            <Check size={10} />
                                                                            <span className="font-bold">신탁 대기중</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Megaphone size={10} /> 
                                                                            <span className="font-bold">신탁으로 폭로</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <h4 className="text-slate-200 font-bold text-sm mb-1">{secret.title}</h4>
                                                        <p className="text-slate-400 text-sm italic border-l-2 border-red-900/30 pl-3">
                                                            <RichText content={secret.description} keywords={availableKeywords} onLinkClick={handleInternalLinkClick} />
                                                        </p>
                                                        {relatedLog && (
                                                            <button onClick={() => handleJumpToLog(relatedLog.id)} className="mt-3 text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                                                <FileText size={10} /> View Evidence (Year {relatedLog.year})
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {selectedFigure.secrets.length === 0 && (
                                                <div className="text-center py-10 text-slate-600 italic">No secrets uncovered yet.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                             </div>
                        </motion.div>
                    ) : 
                    
                    /* === VIEW: FACTION DETAIL === */
                    selectedFaction && loreData ? (
                        <motion.div
                            key={`faction-${selectedFaction.name}`}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="relative"
                        >
                            {/* Sticky Header */}
                            <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 p-6 md:p-10 pb-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center shadow-[0_0_30px_currentColor] bg-black/40 border border-white/10" style={{ color: isFallen ? '#991b1b' : selectedFaction.color }}>
                                    {isFallen ? <Skull size={32} /> : <Shield size={32} />}
                                </div>
                                <h2 className="text-3xl font-display font-bold text-slate-100 mb-2">{selectedFaction.name}</h2>
                                <div className="flex gap-4 text-xs font-mono uppercase tracking-widest text-slate-500">
                                    <span>Power: <b className={isFallen ? 'text-red-500' : 'text-god-gold'}>{selectedFaction.power}</b></span>
                                    <span>Faith: <b className={selectedFaction.attitude >= 0 ? 'text-blue-400' : 'text-red-400'}>{selectedFaction.attitude}</b></span>
                                </div>
                                
                                <div className="flex mt-6 gap-2 p-1 bg-slate-900/80 rounded-lg border border-white/5">
                                  <button onClick={() => setActiveTab('lore')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'lore' ? 'bg-god-gold text-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>Lore & Figures</button>
                                  <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-god-gold text-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>Chronicles</button>
                                </div>
                            </div>

                            <div className="p-6 md:p-10 pt-6">
                                {activeTab === 'lore' ? (
                                    <div className="space-y-8">
                                        {dynamicStatus && (
                                            <div className={`bg-white/5 p-4 rounded-lg border border-white/5 flex gap-3 items-start ${isFallen ? 'opacity-75 grayscale bg-red-900/5' : ''}`}>
                                                <dynamicStatus.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${dynamicStatus.color}`} />
                                                <p className="font-serif italic text-slate-200 text-sm">"{dynamicStatus.text}"</p>
                                            </div>
                                        )}
                                        <div className="prose prose-invert">
                                            <p className="text-slate-300 font-serif leading-relaxed text-lg italic opacity-90">"{loreData.description}"</p>
                                            <p className="text-slate-400 font-sans text-sm leading-relaxed mt-4"><RichText content={loreData.history} keywords={availableKeywords} onLinkClick={handleInternalLinkClick} /></p>
                                        </div>
                                        
                                        {/* Living Figures */}
                                        <div>
                                            <h3 className="flex items-center gap-2 text-god-gold font-display text-lg mb-3 border-b border-god-gold/20 pb-1">
                                                <Users size={18} /><span>Key Figures</span>
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {factionFigures.alive.map(person => (
                                                    <button 
                                                        key={person.id} 
                                                        onClick={() => navigateTo({ type: 'person', id: person.id })}
                                                        className="bg-white/5 p-3 rounded flex items-center gap-3 border border-white/5 hover:border-god-gold/50 hover:bg-white/10 transition-all text-left group"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-god-gold border border-god-gold/20 shrink-0 overflow-hidden">
                                                            {person.portraitUrl ? <img src={person.portraitUrl} className="w-full h-full object-cover" /> : <User size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-200 font-bold text-sm">{person.name}</div>
                                                            <div className="text-slate-500 text-xs italic">{person.role}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                                {factionFigures.alive.length === 0 && <div className="col-span-2 text-center text-slate-500 italic py-4">No active leaders.</div>}
                                            </div>
                                        </div>

                                        {/* Dead Figures (Martyrs & Ancestors) */}
                                        {factionFigures.dead.length > 0 && (
                                            <div className="mt-8">
                                                <h3 className="flex items-center gap-2 text-slate-500 font-display text-lg mb-3 border-b border-slate-800 pb-1">
                                                    <Cross size={18} /><span>순교자 및 선대 인물 (Martyrs & Ancestors)</span>
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {factionFigures.dead.map(person => (
                                                        <button 
                                                            key={person.id} 
                                                            onClick={() => navigateTo({ type: 'person', id: person.id })}
                                                            className="bg-black/20 p-3 rounded flex items-center gap-3 border border-white/5 hover:border-slate-600 hover:bg-white/5 transition-all text-left group grayscale hover:grayscale-0"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 border border-slate-700 shrink-0 overflow-hidden relative">
                                                                {person.portraitUrl ? <img src={person.portraitUrl} className="w-full h-full object-cover opacity-70" /> : <User size={18} />}
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Cross size={12} className="text-white/50" /></div>
                                                            </div>
                                                            <div>
                                                                <div className="text-slate-400 font-bold text-sm line-through decoration-slate-600">{person.name}</div>
                                                                <div className="text-slate-600 text-xs italic">Died Year {person.deathYear}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {factionHistory.map(log => (
                                            <div key={log.id} className="flex gap-4 group">
                                               <div className="flex flex-col items-center"><div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-2 group-hover:bg-god-gold transition-colors"></div><div className="w-px h-full bg-slate-800 my-1"></div></div>
                                               <div className="pb-4"><div className="text-xs font-mono text-slate-500 mb-1">Year {log.year}</div><p className="text-sm text-slate-300 font-serif"><RichText content={log.content} keywords={availableKeywords} onLinkClick={handleInternalLinkClick} /></p></div>
                                            </div>
                                        ))}
                                        {factionHistory.length === 0 && <div className="text-center py-10 text-slate-600 italic">No recorded history.</div>}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LoreModal;
