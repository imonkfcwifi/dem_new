
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Faction, LogEntry } from '../types';
import { audio } from '../services/audioService';
import { REGION_INFO, RegionInfo } from '../constants';
import { Mountain, Trees, Waves, Castle, Tent, MapPin, Landmark, FlaskConical, Leaf, Skull, Shield, Navigation, ZoomIn, ZoomOut, EyeOff } from 'lucide-react';

interface WorldMapProps {
  factions: Faction[];
  culturalVibe: string;
  onFactionClick?: (factionName: string) => void;
  lastLogEntry?: LogEntry; // Passed to trigger visual feedback
}

// Deterministic random for stable map generation
const seededRandom = (seed: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) / 4294967296);
};

const getStablePosition = (name: string, region: string) => {
  const seed = name + region;
  const rngX = seededRandom(seed + 'x');
  const rngY = seededRandom(seed + 'y');
  
  let baseX = 50, baseY = 50;
  const r = (region || "").toLowerCase();
  
  if (r.includes('north')) { baseX = 50; baseY = 25; }
  else if (r.includes('south')) { baseX = 50; baseY = 75; }
  else if (r.includes('east')) { baseX = 75; baseY = 50; }
  else if (r.includes('west')) { baseX = 25; baseY = 50; }
  else if (r.includes('coast')) { baseX = 70; baseY = 70; }
  
  // Smaller, stable spread (jitter)
  const jitterX = (rngX - 0.5) * 30; 
  const jitterY = (rngY - 0.5) * 30;
  
  return { x: Math.max(10, Math.min(90, baseX + jitterX)), y: Math.max(15, Math.min(85, baseY + jitterY)) };
};

const getFactionIcon = (tenets: string[]) => {
  const t = (tenets || []).join(' ').toLowerCase();
  if (t.includes('관료') || t.includes('질서') || t.includes('law')) return Shield;
  if (t.includes('공허') || t.includes('죽음') || t.includes('void')) return Skull;
  if (t.includes('연금') || t.includes('과학') || t.includes('alchemy')) return FlaskConical;
  if (t.includes('자연') || t.includes('숲') || t.includes('bio')) return Leaf;
  if (t.includes('바다') || t.includes('해적')) return Waves;
  if (t.includes('전사') || t.includes('힘')) return Castle;
  if (t.includes('유목') || t.includes('상인')) return Tent;
  if (t.includes('신비') || t.includes('마법') || t.includes('지식')) return Landmark;
  return MapPin;
};

// --- Unit/Citizen Movement Layer ---
const UnitLayer: React.FC<{ factions: Faction[] }> = React.memo(({ factions }) => {
  const routes = useMemo(() => {
    const calculatedRoutes = [];
    if (factions.length < 2) return [];

    factions.forEach((source, i) => {
        if (source.power <= 0) return;
        const unitCount = Math.max(1, Math.min(3, Math.floor(source.power / 30)));
        for (let u = 0; u < unitCount; u++) {
            const targetIndex = Math.floor(seededRandom(source.name + 'target' + u) * factions.length);
            const target = factions[targetIndex === i ? (i + 1) % factions.length : targetIndex];
            if (target.power <= 0) continue;

            const startPos = getStablePosition(source.name, source.region || "");
            const endPos = getStablePosition(target.name, target.region || "");

            calculatedRoutes.push({
                id: `${source.name}-${target.name}-${u}`,
                start: startPos,
                end: endPos,
                color: source.color,
                duration: 10 + seededRandom(source.name + 'speed' + u) * 20 
            });
        }
    });
    return calculatedRoutes;
  }, [factions]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {routes.map(route => (
            <motion.div
                key={route.id}
                className="absolute w-1.5 h-1.5 rounded-full shadow-sm"
                style={{ backgroundColor: route.color } as any}
                initial={{ left: `${route.start.x}%`, top: `${route.start.y}%`, opacity: 0 }}
                animate={{ 
                    left: [`${route.start.x}%`, `${route.end.x}%`],
                    top: [`${route.start.y}%`, `${route.end.y}%`],
                    opacity: [0, 1, 1, 0]
                }}
                transition={{
                    duration: route.duration,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: Math.random() * 5
                }}
            />
        ))}
    </div>
  );
});

// --- Simplified Influence Overlay ---
const InfluenceOverlay: React.FC<{ factions: Faction[] }> = React.memo(({ factions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {factions.map((faction) => {
        if (faction.power <= 0) return null;
        const pos = getStablePosition(faction.name, faction.region || "Center");
        
        return (
          <div
            key={`influence-${faction.name}`}
            className="absolute rounded-full opacity-10 transition-all duration-1000"
            style={{
              backgroundColor: faction.color,
              width: `${100 + faction.power * 4}px`, 
              height: `${100 + faction.power * 4}px`,
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 50px ${faction.color}` 
            }}
          />
        );
      })}
    </div>
  );
});

// --- Simplified Weather Overlay ---
const WeatherOverlay: React.FC<{ vibe: string }> = React.memo(({ vibe }) => {
  const v = vibe.toLowerCase();
  
  if (v.match(/war|blood|death|despair|전쟁|피|죽음/)) {
    return <div className="absolute inset-0 bg-red-900/10 pointer-events-none z-20 mix-blend-overlay" />;
  }
  if (v.match(/science|future|tech|과학|미래/)) {
    return <div className="absolute inset-0 bg-cyan-900/10 pointer-events-none z-20 mix-blend-overlay" />;
  }
  if (v.match(/nature|growth|life|자연|생명/)) {
    return <div className="absolute inset-0 bg-green-900/10 pointer-events-none z-20 mix-blend-overlay" />;
  }
  if (v.match(/holy|divine|god|신성|종교/)) {
    return <div className="absolute inset-0 bg-yellow-900/10 pointer-events-none z-20 mix-blend-overlay" />;
  }
  return null;
});

const RegionMarker: React.FC<{ 
  info: RegionInfo; 
  id: string; 
  onClick: (id: string) => void;
}> = ({ info, id, onClick }) => {
  let Icon = MapPin;
  if (id === 'North') Icon = Navigation; 
  if (id === 'South') Icon = Navigation;
  if (id === 'East') Icon = Navigation;
  if (id === 'West') Icon = Navigation;
  if (id === 'Center') Icon = Navigation;
  if (id === 'Coast') Icon = Navigation;

  return (
    <button
      className="absolute group z-0 opacity-40 hover:opacity-100 transition-opacity"
      style={{ left: `${info.coordinates.x}%`, top: `${info.coordinates.y}%`, transform: 'translate(-50%, -50%)' }}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
    >
        <div className="flex flex-col items-center">
            <Icon size={16} className="text-slate-500" />
            <span className="text-[8px] uppercase tracking-widest text-slate-600 font-mono mt-1">{id}</span>
        </div>
    </button>
  );
};

const RegionDetailOverlay: React.FC<{ regionId: string; onClose: () => void }> = ({ regionId, onClose }) => {
    const data = REGION_INFO[regionId];
    if (!data) return null;
  
    return (
      <div className="absolute bottom-[80px] md:bottom-auto md:top-4 left-4 right-4 md:w-80 z-50 pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a]/95 border border-god-gold/30 p-4 rounded-xl shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white"><EyeOff size={16}/></button>
          <h3 className="font-bold text-god-gold mb-1">{data.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{data.description}</p>
        </motion.div>
      </div>
    );
  };

interface Ripple {
    id: string;
    x: number;
    y: number;
    color: string;
    type: 'war' | 'holy' | 'normal';
}

const WorldMap: React.FC<WorldMapProps> = React.memo(({ factions, culturalVibe, onFactionClick, lastLogEntry }) => {
  const constraintsRef = useRef(null);
  const [scale, setScale] = useState(1.0); 
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const safeFactions = Array.isArray(factions) ? factions : [];

  const zoomIn = () => { audio.playClick(); setScale(prev => Math.min(prev + 0.25, 2.5)); }
  const zoomOut = () => { audio.playClick(); setScale(prev => Math.max(prev - 0.25, 0.6)); }

  // Trigger ripples based on log content
  useEffect(() => {
    if (!lastLogEntry) return;

    safeFactions.forEach(faction => {
        if (lastLogEntry.content.includes(faction.name)) {
            const pos = getStablePosition(faction.name, faction.region || "");
            
            let type: Ripple['type'] = 'normal';
            if (lastLogEntry.content.match(/전쟁|죽음|멸망|공격|파괴|War|Attack/)) type = 'war';
            else if (lastLogEntry.content.match(/기적|축복|신성|기도|Divine|Miracle/)) type = 'holy';

            const newRipple: Ripple = {
                id: `ripple-${Date.now()}-${faction.name}`,
                x: pos.x,
                y: pos.y,
                color: faction.color,
                type
            };

            setRipples(prev => [...prev, newRipple]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== newRipple.id));
            }, 3000);
        }
    });
  }, [lastLogEntry, safeFactions]);

  const handleFactionClick = (name: string) => {
    if (onFactionClick) onFactionClick(name);
  };

  return (
    <div className="relative w-full h-full bg-[#050810] select-none overflow-hidden" ref={constraintsRef}>
      
      {/* Controls */}
      <div className="absolute top-2 left-2 z-50 flex flex-col gap-1 pointer-events-auto">
        <button onClick={zoomIn} className="p-1.5 bg-slate-900/80 border border-slate-700 rounded text-slate-300 hover:text-white"><ZoomIn size={14} /></button>
        <button onClick={zoomOut} className="p-1.5 bg-slate-900/80 border border-slate-700 rounded text-slate-300 hover:text-white"><ZoomOut size={14} /></button>
      </div>
      
      {/* Region Info */}
      <AnimatePresence>
        {selectedRegion && <RegionDetailOverlay regionId={selectedRegion} onClose={() => setSelectedRegion(null)} />}
      </AnimatePresence>

      <motion.div 
        drag
        dragConstraints={constraintsRef} 
        dragElastic={0.1}
        animate={{ scale: scale }}
        transition={{ type: "tween", duration: 0.2 }} // Faster, simpler transition
        className="absolute w-full h-full origin-center cursor-grab active:cursor-grabbing"
        style={{ width: '200%', height: '200%', top: '-50%', left: '-50%' } as any}
        onTap={() => selectedRegion && setSelectedRegion(null)}
      >
          {/* Static Background Pattern */}
          <div className="absolute inset-0 opacity-10" 
             style={{ 
                 backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
                 backgroundSize: '40px 40px' 
             }} 
          />

          {/* Optimized Influence Layer */}
          <InfluenceOverlay factions={safeFactions} />

          {/* Animated Citizens Layer (Lightweight) */}
          <UnitLayer factions={safeFactions} />
          
          {/* Region Markers */}
          <div className="absolute inset-0 z-5 pointer-events-auto">
             {Object.keys(REGION_INFO).map((regionId) => (
                <RegionMarker key={regionId} id={regionId} info={REGION_INFO[regionId]} onClick={setSelectedRegion} />
             ))}
          </div>
          
          {/* Event Ripples */}
          <AnimatePresence>
            {ripples.map(ripple => (
                <motion.div
                    key={ripple.id}
                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                    animate={{ width: 400, height: 400, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute rounded-full pointer-events-none z-30"
                    style={{
                        left: `${ripple.x}%`, 
                        top: `${ripple.y}%`, 
                        transform: 'translate(-50%, -50%)',
                        border: `2px solid ${ripple.type === 'war' ? '#ef4444' : ripple.type === 'holy' ? '#D4AF37' : ripple.color}`,
                        backgroundColor: ripple.type === 'war' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        boxShadow: `0 0 30px ${ripple.color}`
                    } as any}
                />
            ))}
          </AnimatePresence>

          {/* Static Faction Bases (No Jitter) */}
          <div className="absolute inset-0 z-20">
            {safeFactions.map((faction) => {
                if (faction.power <= 0) return null;
                const pos = getStablePosition(faction.name, faction.region || "");
                const Icon = getFactionIcon(faction.tenets);
                
                return (
                  <div
                    key={faction.name}
                    className="absolute flex flex-col items-center justify-center cursor-pointer group hover:z-50"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      audio.playClick(); 
                      handleFactionClick(faction.name);
                    }}
                  >
                    {/* Stable Icon Container */}
                    <div className="relative">
                       {/* Simple Pulse Ring */}
                       <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: faction.color, animationDuration: '3s' }}></div>
                       
                       <div className="relative bg-slate-900 rounded-full p-2 border shadow-lg transition-transform duration-200 group-hover:scale-110" style={{ borderColor: faction.color }}>
                          <Icon size={24} color={faction.color} />
                       </div>
                    </div>
                    
                    <span className="mt-2 text-[10px] font-bold text-slate-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap">
                        {faction.name}
                    </span>
                  </div>
                );
            })}
          </div>

      </motion.div>
      
      <WeatherOverlay vibe={culturalVibe} />

    </div>
  );
});

export default WorldMap;
