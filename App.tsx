

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LogEntry, WorldStats, Faction, PendingDecision, LogType, Person, Secret } from './types';
import { advanceSimulation, generatePortrait, initializeAI } from './services/geminiService';
import { audio } from './services/audioService';
import { storageService } from './services/storageService';
import { getThemeForVibe, FACTION_LORE_DATA, generateInitialPeople } from './constants';
import Chronicle from './components/Chronicle';
import WorldMap from './components/WorldMap';
import StatsPanel from './components/StatsPanel';
import DecisionModal from './components/DecisionModal';
import LoreModal from './components/LoreModal';
import StartScreen from './components/StartScreen';
import WorldHistoryModal from './components/WorldHistoryModal';
import TutorialOverlay, { TutorialStep } from './components/TutorialOverlay';
import IntroSequence from './components/IntroSequence';
import SettingsModal from './components/SettingsModal';
import WhisperOverlay from './components/WhisperOverlay';
import { Send, Hourglass, Play, Pause, Clock, Map as MapIcon, BookOpen, BarChart3, Volume2, VolumeX, Save, RotateCcw, MessageSquareDashed, PenTool, Book, Sparkles, Layers, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_STATS: WorldStats = {
    year: 1,
    population: 5000,
    technologicalLevel: "신화의 시대",
    culturalVibe: "여명",
    dominantReligion: "다신교"
};

const INITIAL_FACTIONS: Faction[] = [
    { name: "아우레아 성황청", power: 45, attitude: 80, tenets: ["신성 관료제", "절대 질서"], color: "#F59E0B", region: "Center" },
    { name: "침묵의 감시자들", power: 30, attitude: 10, tenets: ["엔트로피", "기록 보존"], color: "#06B6D4", region: "North" },
    { name: "유리 연금술 학회", power: 25, attitude: -10, tenets: ["물질 변환", "태양 숭배"], color: "#DC2626", region: "South" },
    { name: "강철뿌리 숲", power: 35, attitude: 30, tenets: ["생체 공학", "자연의 분노"], color: "#166534", region: "West" },
    { name: "심해 무역연합", power: 40, attitude: 50, tenets: ["실용주의", "심해 탐사"], color: "#3B82F6", region: "Coast" },
    { name: "공허의 직조공", power: 20, attitude: -50, tenets: ["허무주의", "천문학"], color: "#7C3AED", region: "East" }
];

const SECONDS_PER_YEAR = 30;

type MobileTab = 'map' | 'chronicle' | 'stats' | 'lore';

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        targetId: 'center',
        title: '침묵하는 신이시여 (The Silent God)',
        content: '오, 위대한 존재시여. 긴 잠에서 깨어나셨군요. 저는 당신의 그림자를 쫓는 늙은 서기관입니다. 이 세계는 당신의 침묵 속에서 번영하고, 타락하고, 다시 태어납니다. 허나 이제 당신의 의지가 다시금 필요할 때가 되었습니다.',
        position: 'center',
        mobileTab: 'map'
    },
    {
        targetId: 'tutorial-map',
        title: '필멸자들의 영토 (The Mortal Realm)',
        content: '굽어보소서. 저 아래 당신의 피조물들이 세운 제국들이 있습니다. 아우레아의 황금 가면부터 강철뿌리의 기계 숲까지... 그들은 서로를 증오하며, 때로는 당신의 이름을 팔아 전쟁을 벌입니다. 지도를 눌러 그들의 오만함을 살피소서.',
        position: 'right',
        mobileTab: 'map'
    },
    {
        targetId: 'tutorial-stats',
        title: '시대의 맥박 (Pulse of Era)',
        content: '세계는 살아 숨 쉬고 있습니다. 인구는 당신의 신도이자 자원이며, 시대의 흐름(Cultural Vibe)은 그들의 집단적 무의식입니다. 기술이 발전할수록 그들은 신을 잊으려 할 것입니다. 그들의 오만함이 하늘을 찌르지 않도록 감시하십시오.',
        position: 'right',
        mobileTab: 'stats'
    },
    {
        targetId: 'tutorial-chronicle',
        title: '성스러운 경전 (The Scripture)',
        content: '이곳은 당신과 필멸자들의 역사가 기록되는 성서입니다. 수천 년의 역사가 단 몇 줄의 문장으로 압축되어 남을 것입니다. 당신이 내린 신탁, 그들이 저지른 죄악, 그리고 세계의 종말까지... 모든 것이 이곳에 영원히 각인됩니다.',
        position: 'left',
        mobileTab: 'chronicle'
    },
    {
        targetId: 'tutorial-input',
        title: '신탁과 개입 (Divine Intervention)',
        content: '이곳이 바로 당신의 권능이 행사되는 곳입니다. "전염병을 내려라", "저들을 축복하라", 혹은 "고대 병기를 깨워라"... 당신이 자연어로 명령하면 세계는 즉시 인과율을 비틀어 응답할 것입니다. 침묵은 금이지만, 말씀은 곧 법입니다.',
        position: 'top',
        mobileTab: 'map'
    },
    {
        targetId: 'tutorial-lore-btn',
        title: '금지된 지식 (Forbidden Secrets)',
        content: '영웅의 가면 뒤에는 추악한 욕망이, 성녀의 기도 뒤에는 배덕한 비밀이 숨어 있습니다. 이 도감(Lore)을 열어 그들의 치부를 들춰내십시오. 필요하다면 그 비밀을 세상에 폭로하여 파멸을 불러올 수도 있습니다. 모든 것은 당신의 뜻대로.',
        position: 'bottom',
        mobileTab: 'map'
    }
];

const App: React.FC = () => {
    // Game State
    const [showIntro, setShowIntro] = useState(true); // START WITH INTRO
    const [gameStarted, setGameStarted] = useState(false);

    // Initialize state with defaults first
    const [stats, setStats] = useState<WorldStats>(INITIAL_STATS);
    const [factions, setFactions] = useState<Faction[]>(INITIAL_FACTIONS);
    const [figures, setFigures] = useState<Person[]>(generateInitialPeople()); // Initial figures from constants
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: 'init', year: 0, type: LogType.SYSTEM, content: "대지가 갈라지고 바다가 채워졌습니다. 여섯 개의 철학이 문명을 시작합니다." }
    ]);
    const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

    const [input, setInput] = useState("");
    const [commandQueue, setCommandQueue] = useState<string[]>([]); // New: Array queue instead of single string
    const [queuedSecretIds, setQueuedSecretIds] = useState<Set<string>>(new Set()); // Tracks which secrets are in queue
    const [loading, setLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true); // New loading state for DB load

    const [isPlaying, setIsPlaying] = useState(false); // Default to false until loaded
    const [timerProgress, setTimerProgress] = useState(0);
    const [turnFlash, setTurnFlash] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(audio.isEnabled());
    const [isSaving, setIsSaving] = useState(false);

    // UI State
    const [showLoreModal, setShowLoreModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false); // New: History Modal
    const [showSettingsModal, setShowSettingsModal] = useState(false); // New: Settings Modal
    const [loreInitialFaction, setLoreInitialFaction] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<MobileTab>('map');
    const [showTutorial, setShowTutorial] = useState(false);

    // Added input and commandQueue to stateRef for async access
    const stateRef = useRef({ stats, factions, figures, logs, loading, pendingDecision, isPlaying, commandQueue, input });

    // Ref to track which figures are currently generating portraits to prevent duplicates
    const generatingPortraitsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        stateRef.current = { stats, factions, figures, logs, loading, pendingDecision, isPlaying, commandQueue, input };
    }, [stats, factions, figures, logs, loading, pendingDecision, isPlaying, commandQueue, input]);

    // Load Game Async
    const loadGameData = async () => {
        const savedGame = await storageService.loadGame();
        if (savedGame) {
            setStats(savedGame.stats);
            setFactions(savedGame.factions);
            setLogs(savedGame.logs);
            setPendingDecision(savedGame.pendingDecision);
            // Load figures if they exist, otherwise fallback to init
            if (savedGame.figures && savedGame.figures.length > 0) {
                setFigures(savedGame.figures);
            }
        }
        setIsInitializing(false);

        // Check Tutorial
        const hasSeenTutorial = localStorage.getItem('tutorial_seen');
        if (!hasSeenTutorial) {
            setTimeout(() => setShowTutorial(true), 1500); // Slight delay for effect
        } else {
            setIsPlaying(true); // Start game immediately if tutorial seen
        }
    };

    // Audio Init on Interaction
    useEffect(() => {
        const unlockAudio = () => {
            audio.resume();
            // audio.playBGM(); // Start BGM loop - REMOVED: BGM triggers after intro now
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    // Autosave Effect
    useEffect(() => {
        if (!gameStarted || isInitializing) return; // Don't autosave while loading or before start

        const timeoutId = setTimeout(async () => {
            setIsSaving(true);
            await storageService.saveGame(stats, factions, figures, logs, pendingDecision);
            setTimeout(() => setIsSaving(false), 1000);
        }, 1000); // Increased debounce to 1s

        return () => clearTimeout(timeoutId);
    }, [stats, factions, figures, logs, pendingDecision, isInitializing, gameStarted]);

    // --- COMMAND QUEUE PROCESSOR ---
    useEffect(() => {
        const { loading, pendingDecision, commandQueue } = stateRef.current;

        // Only execute automatically if not loading AND no decision is blocking us.
        if (!loading && !pendingDecision && commandQueue.length > 0) {
            console.log("Auto-processing queue...");
            handleTurn(null, null, 5);
        }
    }, [loading, pendingDecision, commandQueue]);

    // Android Back Button Handling (Popstate)
    useEffect(() => {
        window.history.pushState(null, document.title, window.location.href);
        const handlePopState = (event: PopStateEvent) => {
            if (showSettingsModal) {
                setShowSettingsModal(false);
                window.history.pushState(null, document.title, window.location.href);
            } else if (showLoreModal) {
                // Handled inside LoreModal for finer navigation
            } else if (showHistoryModal) {
                setShowHistoryModal(false);
                window.history.pushState(null, document.title, window.location.href);
            } else if (activeTab !== 'map') {
                setActiveTab('map');
                window.history.pushState(null, document.title, window.location.href);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activeTab, showLoreModal, showHistoryModal, showSettingsModal]);

    useEffect(() => {
        const interval = setInterval(() => {
            // Check queuedInput from ref to prevent stale closures
            const { loading, pendingDecision, isPlaying, commandQueue } = stateRef.current;

            // Stop timer if loading, resolving a decision, paused, OR if there is a queued command waiting
            // Also stop timer if Tutorial is active
            if (!gameStarted || !isPlaying || loading || pendingDecision || commandQueue.length > 0 || showTutorial) return;

            setTimerProgress(prev => {
                if (prev >= 100) {
                    handleTurn(null, null, 5);
                    return 0;
                }
                return prev + (100 / (SECONDS_PER_YEAR * 10));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [gameStarted, showTutorial]);

    const toggleSound = () => {
        const enabled = audio.toggle();
        setSoundEnabled(enabled);
        if (enabled) audio.playClick();
    };

    const handleStartGame = () => {
        initializeAI(); // Try initialize with stored/env key if not already
        setGameStarted(true);
        loadGameData();
        audio.playTurnStart(); // Big thud for start
    };

    const handleOpenHistory = () => {
        setIsPlaying(false);
        audio.playClick();
        setShowHistoryModal(true);
    };

    const handleOpenSettings = () => {
        audio.playClick();
        setShowSettingsModal(true);
    };

    const handleOpenLore = () => {
        setLoreInitialFaction(null); // Just open list
        setShowLoreModal(true);
        audio.playClick();
    };

    const handleTutorialComplete = () => {
        localStorage.setItem('tutorial_seen', 'true');
        setShowTutorial(false);
        setIsPlaying(true); // Start time flow
        audio.playSuccess();
    };

    const handleReplayTutorial = () => {
        setShowSettingsModal(false);
        localStorage.removeItem('tutorial_seen');
        setCurrentTutorialStep(0); // Reset local step if needed, but TutorialOverlay manages it usually
        setShowTutorial(true);
        setActiveTab('map');
    };

    const handleTutorialStepChange = (index: number) => {
        const step = TUTORIAL_STEPS[index];
        if (step && step.mobileTab) {
            setActiveTab(step.mobileTab);
        }
    };

    // Needed just to reset tutorial properly if implemented in state above, 
    // but TutorialOverlay handles its own index state locally. 
    // To force reset, we can remount it by toggling showTutorial.
    const [currentTutorialStep, setCurrentTutorialStep] = useState(0);


    const handleResetConfirm = async () => {
        audio.playClick();
        await storageService.clearGame();
        // Also clear tutorial seen to re-experience it? No, keep it.
        window.location.reload();
    };

    // --- Hyperlink & Keyword System ---
    const allKeywords = useMemo(() => {
        const factionNames = factions.map(f => f.name);
        const figureNames = figures.map(f => f.name);
        // Sort by length desc to match longest strings first in RichText
        return [...factionNames, ...figureNames].sort((a, b) => b.length - a.length);
    }, [factions, figures]);

    const handleLinkClick = useCallback((keyword: string) => {
        setLoreInitialFaction(keyword);
        setShowLoreModal(true);
    }, []);

    const handleGeneratePortrait = async (personId: string) => {
        const person = figures.find(f => f.id === personId);
        if (!person || person.portraitUrl || generatingPortraitsRef.current.has(personId)) return;

        generatingPortraitsRef.current.add(personId);

        try {
            const imageUrl = await generatePortrait(person);
            if (imageUrl) {
                setFigures(prev => prev.map(p =>
                    p.id === personId ? { ...p, portraitUrl: imageUrl } : p
                ));
            }
        } finally {
            generatingPortraitsRef.current.delete(personId);
        }
    };

    const handleRevealSecret = useCallback((secret: Secret, personName: string) => {
        const marker = ":::REVELATION:::";
        const revealCommand = `${marker}나, 침묵하는 신이 명하노니. ${personName}의 감춰진 죄악 "${secret.title}"을(를) 세상에 낱낱이 공개하라. "${secret.description}" 이 진실이 심판의 불씨가 되게 하라.`;

        const currentInput = stateRef.current.input.trim();
        const queueUpdates: string[] = [];

        if (currentInput) {
            queueUpdates.push(currentInput);
            setInput("");
            audio.playClick();
        }

        queueUpdates.push(revealCommand);
        setCommandQueue(prev => [...prev, ...queueUpdates]);
        setQueuedSecretIds(prev => new Set(prev).add(secret.id));
        audio.playClick();

    }, []);

    const handleCommandSubmit = () => {
        const cmd = input.trim();
        if (!cmd) return;

        setInput("");
        setCommandQueue(prev => [...prev, cmd]);
        audio.playClick();
    };

    const handleTurn = async (playerCommandArg: string | null = null, decisionId: string | null = null, yearsToAdvance: number = 10) => {
        const currentState = stateRef.current;
        if (currentState.loading) return;

        const currentQueue = currentState.commandQueue;
        let finalCommand = playerCommandArg;

        if (currentQueue.length > 0) {
            const queuedText = currentQueue.join("\n\n");
            if (finalCommand) {
                finalCommand = `${queuedText}\n\n${finalCommand}`;
            } else {
                finalCommand = queuedText;
            }
            setCommandQueue([]);
            setQueuedSecretIds(new Set());
        }

        if (finalCommand || decisionId) audio.playSuccess();
        else audio.playTurnStart();

        setLoading(true);

        let currentLogs = [...currentState.logs];
        if (finalCommand) {
            let logType = LogType.CHAT;
            let content = finalCommand;

            // Check for Revelation Marker
            if (finalCommand.includes(":::REVELATION:::")) {
                logType = LogType.REVELATION;
                content = finalCommand.replace(/:::REVELATION:::/g, "").trim();
                finalCommand = content; // Send clean text to AI
            }

            const cmdLog: LogEntry = {
                id: `cmd-${Date.now()}`,
                year: currentState.stats.year,
                type: logType,
                content: `"${content}"`
            };
            currentLogs.push(cmdLog);
            setLogs(currentLogs);
        }

        try {
            const result = await advanceSimulation(
                currentState.stats,
                currentState.factions,
                currentState.figures,
                currentLogs,
                finalCommand,
                decisionId,
                yearsToAdvance
            );

            setTurnFlash(true);
            setTimeout(() => setTurnFlash(false), 500);

            setFigures((prevFigures: Person[]) => {
                const newFiguresMap = new Map<string, Person>(prevFigures.map(f => [f.id, f]));
                const updates: Person[] = result.updatedFigures || [];

                updates.forEach((update: Person) => {
                    let existingId = update.id;
                    let existing = newFiguresMap.get(existingId);

                    if (!existing) {
                        const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
                        const updateNameNorm = normalize(update.name);

                        const matchByName = Array.from(newFiguresMap.values()).find((f: Person) => {
                            const fNameNorm = normalize(f.name);
                            return fNameNorm === updateNameNorm || fNameNorm.includes(updateNameNorm) || updateNameNorm.includes(fNameNorm);
                        });

                        if (matchByName) {
                            existing = matchByName;
                            existingId = existing.id;
                            update.id = existingId;
                        }
                    }

                    if (existing) {
                        const existingRels = new Map((existing.relationships || []).map(r => [r.targetId, r]));
                        if (update.relationships) {
                            update.relationships.forEach(r => existingRels.set(r.targetId, r));
                        }

                        const merged: Person = {
                            ...existing,
                            ...update,
                            id: existingId,
                            biography: (update.biography && update.biography.length > 50) ? update.biography : existing.biography,
                            portraitUrl: existing.portraitUrl || update.portraitUrl,
                            secrets: [
                                ...(existing.secrets || []),
                                ...(update.secrets || [])
                            ].filter((s, index, self) =>
                                index === self.findIndex((t) => t.title === s.title)
                            ),
                            relationships: Array.from(existingRels.values())
                        };
                        newFiguresMap.set(existingId, merged);
                    } else {
                        newFiguresMap.set(update.id, update);
                    }
                });

                return Array.from(newFiguresMap.values());
            });

            setFactions((prevFactions) => {
                const factionMap = new Map(prevFactions.map(f => [f.name, f]));
                result.factions.forEach(updatedFaction => {
                    factionMap.set(updatedFaction.name, updatedFaction);
                });
                return Array.from(factionMap.values());
            });

            setStats(prev => ({
                ...prev,
                year: result.newYear,
                population: Math.max(0, prev.population + result.populationChange),
                ...result.stats
            }));

            setLogs([...currentLogs, ...result.logs]);

            setPendingDecision(result.pendingDecision || null);
            setTimerProgress(0);

            if (result.pendingDecision) {
                audio.playDivinePresence();

                // Log the petition into the Scripture
                const petitionLog: LogEntry = {
                    id: `petition-${Date.now()}`,
                    year: result.newYear,
                    type: LogType.PETITION,
                    content: result.pendingDecision.message,
                    relatedFigureIds: [],
                    flavor: `${result.pendingDecision.senderName} (${result.pendingDecision.senderRole})의 간청`
                };
                // Append to the list of logs we just set
                setLogs(prev => [...prev, petitionLog]);
            }

        } catch (e) {
            console.error("Turn Error", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative w-full h-[100dvh] overflow-hidden transition-colors duration-1000 ${getThemeForVibe(stats.culturalVibe).id}`}>

            {/* Dynamic Background */}
            <div
                className="absolute inset-0 z-0 transition-colors duration-2000 ease-in-out"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${getThemeForVibe(stats.culturalVibe).colors.bgStart}, ${getThemeForVibe(stats.culturalVibe).colors.bgEnd})`
                }}
            />

            {/* Intro Sequence (Before Start Screen) */}
            <AnimatePresence>
                {showIntro && (
                    <motion.div
                        key="intro"
                        className="absolute inset-0 z-[200]"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <IntroSequence onComplete={() => {
                            setShowIntro(false);
                            audio.playBGM(); // Start BGM immediately after intro is done
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Start Screen (Fades in after Intro) */}
            {!gameStarted && !showIntro && (
                <motion.div
                    key="start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 z-[100]"
                >
                    <StartScreen onStart={handleStartGame} />
                </motion.div>
            )}

            {/* Main Game UI */}
            {gameStarted && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0">
                        {/* Header / Top Bar */}
                        <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between px-4 pointer-events-none">
                            <div className="flex items-center gap-3 pointer-events-auto">
                                <div className="flex flex-col">
                                    <h1 className="text-god-gold font-display font-bold text-xl leading-none tracking-widest drop-shadow-md">DEUS EX</h1>
                                    <span className="text-[10px] text-slate-400 font-mono tracking-[0.3em]">MACHINA</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pointer-events-auto">
                                <div className="flex flex-col items-end mr-2">
                                    <span className="text-2xl font-display font-bold text-slate-100 leading-none">{stats.year}년</span>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                        <Clock size={10} />
                                        <span>{stats.culturalVibe}</span>
                                    </div>
                                </div>

                                <button id="tutorial-lore-btn" onClick={handleOpenLore} className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 relative border border-white/5 hover:border-god-gold/30 hover:text-god-gold transition-all" title="도감">
                                    <BookOpen size={18} />
                                </button>

                                <button
                                    onClick={handleOpenHistory}
                                    className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 relative border border-white/5 hover:border-god-gold/30 hover:text-god-gold transition-all"
                                    title="기록소 및 리셋"
                                >
                                    <RotateCcw size={18} />
                                </button>

                                <button
                                    onClick={handleOpenSettings}
                                    className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 relative border border-white/5 hover:border-god-gold/30 hover:text-god-gold transition-all"
                                    title="설정"
                                >
                                    <Settings size={18} />
                                </button>
                            </div>
                        </header>

                        {/* Desktop Grid Layout - REDESIGNED: Left Dashboard, Right Chronicle */}
                        <main className="absolute inset-0 pt-16 pb-20 md:pb-8 z-10 hidden md:grid grid-cols-12 gap-4 px-6 h-full pointer-events-none">

                            {/* Left Column: Dashboard (Map + Stats + Input) */}
                            <div className="col-span-4 h-full flex flex-col gap-4 pointer-events-auto pb-4 min-h-0">

                                {/* Top: Map (Square-ish context) */}
                                <div id="tutorial-map" className="h-[35%] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group bg-[#0f172a]">
                                    <WorldMap
                                        factions={factions}
                                        culturalVibe={stats.culturalVibe}
                                        onFactionClick={handleLinkClick}
                                        lastLogEntry={logs[logs.length - 1]} // Pass latest log for ripple effects
                                    />
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-slate-400 uppercase tracking-widest border border-white/5">
                                        World Status
                                    </div>
                                    {/* Turn Flash Effect */}
                                    <AnimatePresence>
                                        {turnFlash && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-white pointer-events-none z-50 mix-blend-overlay"
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Whisper Overlay on Map */}
                                    <WhisperOverlay loading={loading} stats={stats} factions={factions} figures={figures} />
                                </div>

                                {/* Middle: Stats (New List Design) */}
                                <div id="tutorial-stats" className="flex-1 min-h-0">
                                    <StatsPanel stats={stats} factions={factions} />
                                </div>

                                {/* Bottom: Input (Divine Command) */}
                                <div id="tutorial-input" className="h-[140px] bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg relative flex flex-col shrink-0 overflow-hidden group focus-within:border-god-gold/50 transition-colors">

                                    <div className="flex-1 p-3 flex flex-col">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-god-gold uppercase tracking-widest flex items-center gap-1">
                                                <Sparkles size={10} /> Divine Will
                                            </span>
                                            {/* Queue Status inside input area */}
                                            <AnimatePresence>
                                                {commandQueue.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                                        className="text-[9px] text-slate-400 bg-black/30 px-2 py-0.5 rounded-full flex items-center gap-1"
                                                    >
                                                        <Layers size={8} /> Queue: {commandQueue.length}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommandSubmit(); } }}
                                            placeholder={loading ? "신탁이 접수되었습니다..." : "역사에 개입하십시오..."}
                                            className="w-full flex-1 bg-transparent text-slate-200 text-sm font-serif placeholder-slate-600 focus:outline-none resize-none scrollbar-hide leading-relaxed"
                                        />
                                    </div>

                                    {/* Input Footer */}
                                    <div className="h-10 border-t border-white/5 bg-black/20 flex justify-between items-center px-3">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setIsPlaying(!isPlaying)} className="text-slate-500 hover:text-god-gold transition-colors">
                                                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                            </button>
                                            {/* Timer Bar */}
                                            <div className="w-20 h-0.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-god-gold"
                                                    style={{ width: `${timerProgress}%` } as any}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCommandSubmit}
                                            disabled={!input.trim()}
                                            className="flex items-center gap-2 px-3 py-1 rounded bg-god-gold/10 hover:bg-god-gold/20 text-god-gold disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-god-gold/20 text-[10px] uppercase font-bold tracking-wider"
                                        >
                                            {(loading || commandQueue.length > 0) ? (
                                                <>Queued</>
                                            ) : (
                                                <>Command <Send size={10} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* Right Column: Chronicles (The Main Content) */}
                            <div id="tutorial-chronicle" className="col-span-8 h-full pointer-events-auto pb-4 flex flex-col min-h-0">
                                <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-md flex flex-col">
                                    <Chronicle logs={logs} keywords={allKeywords} onLinkClick={handleLinkClick} />
                                </div>
                            </div>

                        </main>

                        {/* Mobile Layout */}
                        <main className="md:hidden absolute inset-0 pt-16 pb-0 z-10 flex flex-col pointer-events-auto">
                            <div className="flex-1 relative overflow-hidden">
                                {/* View Switcher based on Active Tab */}
                                {activeTab === 'map' && (
                                    <div id="tutorial-map" className="h-full relative">
                                        <WorldMap factions={factions} culturalVibe={stats.culturalVibe} onFactionClick={handleLinkClick} lastLogEntry={logs[logs.length - 1]} />
                                        {/* Whisper Overlay on Mobile Map */}
                                        <WhisperOverlay loading={loading} stats={stats} factions={factions} figures={figures} />
                                    </div>
                                )}
                                {activeTab === 'chronicle' && (
                                    <div id="tutorial-chronicle" className="absolute inset-0 bg-[#0f172a]/95">
                                        <Chronicle logs={logs} keywords={allKeywords} onLinkClick={handleLinkClick} />
                                    </div>
                                )}
                                {activeTab === 'stats' && (
                                    <div id="tutorial-stats" className="p-4 h-full overflow-y-auto bg-[#0f172a]">
                                        <StatsPanel stats={stats} factions={factions} />
                                    </div>
                                )}
                                {activeTab === 'lore' && (
                                    <div className="absolute inset-0 bg-[#0f172a]">
                                        <div className="p-10 text-center text-slate-500">Tap the book icon above to open Lore.</div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Bottom Input & Nav */}
                            <div id="tutorial-input" className="bg-[#0f172a] border-t border-white/10 p-2 safe-area-pb relative shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-30">

                                {/* Timer Progress Bar (Mobile) */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
                                    <motion.div
                                        className="h-full bg-god-gold shadow-[0_0_10px_#D4AF37]"
                                        style={{ width: `${timerProgress}%` } as any}
                                        transition={{ ease: "linear" }}
                                    />
                                </div>

                                {/* Input Compact */}
                                <div className="flex items-center gap-2 mb-2 px-2 mt-2">
                                    <div className="flex-1 bg-slate-800/50 rounded-full border border-white/10 flex items-center px-4 py-2 relative focus-within:border-god-gold/30 transition-colors">
                                        {/* Queue Indicator Mobile */}
                                        {commandQueue.length > 0 && (
                                            <div className="absolute -top-8 right-0 bg-god-gold px-2 py-0.5 text-[8px] text-slate-900 font-bold uppercase rounded-full shadow flex items-center gap-1">
                                                <Layers size={8} /> Queued: {commandQueue.length}
                                            </div>
                                        )}

                                        <PenTool size={14} className="text-slate-500 mr-2 shrink-0" />
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder={(loading) ? "Processing Queue..." : "Divine command..."}
                                            className="bg-transparent w-full text-sm text-white focus:outline-none placeholder-slate-600 font-serif"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCommandSubmit}
                                        className="p-3 bg-god-gold rounded-full text-slate-900 shadow-lg shadow-god-gold/20 shrink-0 active:scale-95 transition-transform"
                                    >
                                        {(loading || commandQueue.length > 0) ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex justify-around items-center pt-1 border-t border-white/5">
                                    <button onClick={() => { audio.playClick(); setActiveTab('chronicle'); }} className={`p-2 flex flex-col items-center gap-1 transition-colors ${activeTab === 'chronicle' ? 'text-god-gold' : 'text-slate-500'}`}>
                                        <BookOpen size={20} />
                                        <span className="text-[10px]">Chronicles</span>
                                    </button>
                                    <button onClick={() => { audio.playClick(); setActiveTab('map'); }} className={`p-2 flex flex-col items-center gap-1 transition-colors ${activeTab === 'map' ? 'text-god-gold' : 'text-slate-500'}`}>
                                        <MapIcon size={20} />
                                        <span className="text-[10px]">World</span>
                                    </button>
                                    <button onClick={() => { audio.playClick(); setActiveTab('stats'); }} className={`p-2 flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-god-gold' : 'text-slate-500'}`}>
                                        <BarChart3 size={20} />
                                        <span className="text-[10px]">Stats</span>
                                    </button>
                                    <button onClick={() => { handleOpenLore(); }} className={`p-2 flex flex-col items-center gap-1 transition-colors ${showLoreModal ? 'text-god-gold' : 'text-slate-500'}`}>
                                        <Book size={20} />
                                        <span className="text-[10px]">Lore</span>
                                    </button>
                                </div>
                            </div>
                        </main>
                    </motion.div>

                    {/* Modals & Overlays - MOVED OUTSIDE motion.div TO PREVENT FIXED POSITIONING ISSUES */}
                    <AnimatePresence>
                        {/* Tutorial Overlay */}
                        {showTutorial && (
                            <TutorialOverlay
                                key={currentTutorialStep} // Force remount if needed on manual replay
                                steps={TUTORIAL_STEPS}
                                onComplete={handleTutorialComplete}
                                onStepChange={handleTutorialStepChange}
                            />
                        )}

                        {/* Decision Modal */}
                        {pendingDecision && (
                            <DecisionModal
                                key={pendingDecision.id}
                                decision={pendingDecision}
                                isLoading={loading}
                                keywords={allKeywords}
                                onDecide={(optId) => handleTurn(null, optId, 2)}
                                onLinkClick={handleLinkClick}
                            />
                        )}

                        {/* Lore Modal */}
                        {showLoreModal && (
                            <LoreModal
                                factions={factions}
                                figures={figures}
                                logs={logs}
                                keywords={allKeywords}
                                initialFaction={loreInitialFaction}
                                queuedSecretIds={queuedSecretIds}
                                onClose={() => { setShowLoreModal(false); setLoreInitialFaction(null); }}
                                onLinkClick={handleLinkClick}
                                onRequestPortrait={handleGeneratePortrait}
                                onRevealSecret={handleRevealSecret}
                            />
                        )}

                        {/* History Modal */}
                        {showHistoryModal && (
                            <WorldHistoryModal
                                currentStats={stats}
                                currentFactions={factions}
                                currentFigures={figures}
                                onClose={() => { setShowHistoryModal(false); setIsPlaying(true); }}
                                onResetConfirm={handleResetConfirm}
                            />
                        )}

                        {/* Settings Modal */}
                        {showSettingsModal && (
                            <SettingsModal
                                onClose={() => setShowSettingsModal(false)}
                                onReplayTutorial={handleReplayTutorial}
                            />
                        )}
                    </AnimatePresence>


                    {/* Autosave Indicator */}
                    <AnimatePresence>
                        {isSaving && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="fixed bottom-24 right-4 md:bottom-4 md:right-4 z-50 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/5 text-[10px] text-slate-400 flex items-center gap-2"
                            >
                                <Save size={10} /> Saving...
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};

export default App;