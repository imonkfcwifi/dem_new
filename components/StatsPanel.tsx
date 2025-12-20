
import React from 'react';
import { Faction, WorldStats } from '../types';
import { Users, Brain, Globe, Shield, Heart, Skull, Zap, Crown, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsPanelProps {
  stats: WorldStats;
  factions: Faction[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, factions }) => {
  const safeFactions = Array.isArray(factions) ? factions : [];
  
  // Sort factions by Power desc
  const sortedFactions = [...safeFactions].sort((a, b) => b.power - a.power);

  const StatCard = ({ icon: Icon, label, value, subValue, colorClass }: any) => (
    <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-xl border border-white/5 p-4 flex items-center gap-4 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className={`p-3 rounded-full bg-[#0f172a] border border-white/5 ${colorClass} group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col z-10">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</span>
        <span className="font-display font-bold text-lg text-slate-200 leading-none mt-1">{value}</span>
        {subValue && <span className="text-[10px] text-slate-400 font-serif italic mt-0.5">{subValue}</span>}
      </div>
      {/* Decorative Glow */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-10 blur-xl ${colorClass.replace('text-', 'bg-')}`}></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full w-full min-h-0">
      
      {/* 1. World State Header */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <StatCard 
            icon={Users} 
            label="Population" 
            value={stats.population.toLocaleString()} 
            colorClass="text-blue-400"
        />
        <StatCard 
            icon={Brain} 
            label="Current Era" 
            value={stats.technologicalLevel} 
            colorClass="text-purple-400"
        />
      </div>
      <div className="shrink-0">
         <StatCard 
            icon={Globe} 
            label="Cultural Vibe" 
            value={stats.culturalVibe} 
            subValue={`Dominant: ${stats.dominantReligion}`}
            colorClass="text-god-gold"
        />
      </div>

      {/* 2. Faction Hierarchy List */}
      <div className="flex-1 bg-[#1e293b]/40 backdrop-blur-sm rounded-2xl border border-white/5 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
            <h3 className="text-xs font-display font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                <Crown size={14} className="text-god-gold" />
                Dominion Hierarchy
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Power / Faith</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
            {sortedFactions.map((f, idx) => {
                const isDead = f.power <= 0;
                const faithColor = f.attitude >= 50 ? 'text-blue-400' : f.attitude >= 0 ? 'text-slate-400' : 'text-red-400';
                const FaithIcon = f.attitude >= 50 ? Heart : f.attitude >= -20 ? Shield : Skull;
                
                return (
                    <motion.div 
                        key={f.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`group relative p-3 rounded-lg border border-transparent hover:bg-white/5 transition-all ${isDead ? 'opacity-50 grayscale' : ''}`}
                    >
                        {/* Background Bar for Power */}
                        {!isDead && (
                            <div 
                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white/5 to-transparent rounded-l-lg transition-all duration-1000" 
                                style={{ width: `${f.power}%`, opacity: 0.1 }} 
                            />
                        )}

                        <div className="flex justify-between items-center relative z-10">
                            {/* Left: Name & Rank */}
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] text-slate-600 w-4 text-center">{idx + 1}</span>
                                <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: f.color }} />
                                <div>
                                    <div className={`font-display text-sm font-bold ${isDead ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                        {f.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="h-1 w-16 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-400" style={{ width: `${f.power}%`, backgroundColor: f.color }} />
                                        </div>
                                        <span className="text-[9px] text-slate-500 font-mono">{f.power}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Faith Indicator */}
                            <div className="flex flex-col items-end gap-1 min-w-[50px]">
                                <div className={`flex items-center gap-1 ${faithColor}`}>
                                    <FaithIcon size={12} className={f.attitude < -50 ? "animate-pulse" : ""} />
                                    <span className="font-bold text-xs">{f.attitude}</span>
                                </div>
                                <span className="text-[8px] text-slate-600 uppercase tracking-wider">Faith</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
