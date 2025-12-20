import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldStats, Faction, Person } from '../types';
import { Wind, Sparkles, Activity, Skull, Crown, Users } from 'lucide-react';

interface WhisperOverlayProps {
    loading: boolean;
    stats: WorldStats;
    factions: Faction[];
    figures: Person[];
}

// Phrases based on Cultural Vibe
const VIBE_WHISPERS: Record<string, string[]> = {
    default: [
        "바람의 방향이 바뀌고 있습니다...",
        "누군가 당신의 이름을 부르며 기도합니다.",
        "오래된 별이 지고 있습니다.",
        "필멸자들은 여전히 답을 찾지 못했습니다.",
        "대지가 당신의 침묵을 경청합니다.",
        "당신의 이름은 모든 곳에서 불러지고 있습니다.",
        "사람들은 의미 없는 징조에도 고개를 듭니다.",
        "침묵이 길어질수록 해석은 늘어납니다.",
        "하늘은 아무 말도 하지 않고 있습니다.",
        "기도와 저주의 경계가 흐려지고 있습니다.",
        "사소한 사건들이 연결되기 시작합니다.",

        "사람들은 우연을 기록하기 시작했습니다.",
        "기록은 곧 신화가 됩니다.",
        "신화는 다시 진실로 받아들여집니다.",
        "시간은 조용히 다음 장으로 넘어갑니다.",
        "아직 누구도 결말을 보지 못했습니다.",

        "당신의 침묵이 하나의 선택으로 해석됩니다.",
        "기다림 자체가 신앙이 되고 있습니다.",
        "의심은 줄어들지 않았습니다.",
        "확신도 아직 도달하지 못했습니다.",
        "세계는 중간 지점에 머물러 있습니다.",

        "별의 배열이 서서히 어긋나고 있습니다.",
        "사람들은 그것을 눈치채지 못합니다.",
        "그러나 불안은 남아 있습니다.",
        "보이지 않는 균열이 퍼지고 있습니다.",
        "아직 무너질 이유는 충분하지 않습니다.",

        "사람들은 답보다 방향을 원합니다.",
        "방향은 아직 주어지지 않았습니다.",
        "선택은 계속 미뤄지고 있습니다.",
        "침묵은 계속되고 있습니다.",
        "세계는 당신을 기다리고 있습니다."
    ],
    war: [
        "철과 피의 냄새가 바람에 실려옵니다.",
        "어머니들이 자식의 이름을 비명처럼 부릅니다.",
        "까마귀들이 시신 위를 맴돌고 있습니다.",
        "전쟁의 북소리가 대지를 울립니다.",
        "칼날이 부딪히는 소리가 끊이지 않습니다."
    ],
    holy: [
        "거대한 찬송가 소리가 구름을 뚫고 올라옵니다.",
        "수천 개의 촛불이 당신을 향해 타오릅니다.",
        "광신도들이 거리에서 스스로를 채찍질합니다.",
        "순교자의 피가 성소를 적십니다.",
        "이단 심문관들이 죄인을 색출하고 있습니다."
    ],
    science: [
        "거대한 기계 톱니가 맞물려 돌아갑니다.",
        "학자들이 신을 부정하는 논문을 쓰고 있습니다.",
        "증기 기관의 굉음이 하늘을 가립니다.",
        "밤에도 꺼지지 않는 불빛들이 도시를 채웁니다.",
        "새로운 발명이 옛 신앙을 대체하고 있습니다."
    ],
    nature: [
        "숲의 뿌리가 도시의 기반을 잠식합니다.",
        "짐승들의 울음소리가 밤을 지배합니다.",
        "버려진 신전 위로 이끼가 자라납니다.",
        "자연이 문명을 다시 삼키려 합니다."
    ],
    void: [
        "심연에서 알 수 없는 속삭임이 들립니다.",
        "별들이 하나둘씩 자취를 감춥니다.",
        "사람들이 그림자 속에서 길을 잃습니다.",
        "공허가 현실의 경계를 갉아먹고 있습니다."
    ]
};

const SYSTEM_LOGS = [
    "인과율 계산 중...",
    "나비 효과 시뮬레이션...",
    "운명의 실타래 재배열 중...",
    "역사의 분기점 확인 중...",
    "필멸자들의 자유 의지 억제 중...",

    "확률 분포 재산정 중...",
    "미래 가능성 트리 확장 중...",
    "비결정성 변수 주입 중...",
    "예측 오차 범위 조정 중...",
    "우연 요소 활성화...",

    "선택지 영향도 분석 중...",
    "개입 여부 검증 중...",
    "침묵 지속 가능성 평가 중...",
    "관측 편향 제거 중...",
    "결과 왜곡 방지 프로토콜 실행...",

    "시간선 안정성 점검 중...",
    "연쇄 반응 한계치 계산 중...",
    "개별 사건 중요도 재분류 중...",
    "사소한 선택 확대 적용 중...",
    "무시된 변인 재검토 중...",

    "운명 개입 임계치 확인 중...",
    "자율 서사 유지 여부 판단 중...",
    "강제 개입 확률 감소 중...",
    "의도하지 않은 개입 무효화 중...",
    "침묵 해석 오류 수정 중...",

    "기억 보존률 계산 중...",
    "역사 기록 왜곡 가능성 평가 중...",
    "승자 서사 편향 조정 중...",
    "패자 기록 소실 확인 중...",
    "신화화 단계 진행 중...",

    "집단 행동 패턴 분석 중...",
    "광신 확산 속도 계산 중...",
    "회의론 증가율 추적 중...",
    "신앙 밀도 지도 갱신 중...",
    "의심 임계점 접근 중...",

    "전쟁 발생 확률 재계산 중...",
    "외교 붕괴 가능성 평가 중...",
    "내부 분열 지수 상승 감지...",
    "폭력 임계 상태 진입 확인...",
    "대규모 사건 준비 단계...",

    "자연 개입 변수 활성화...",
    "재난 발생 조건 충족 여부 확인 중...",
    "환경 반작용 시뮬레이션...",
    "문명 지속 가능성 재평가 중...",
    "회복 가능성 잔여치 계산 중...",

    "공허 영향도 스캔 중...",
    "존재 붕괴 확률 상승 감지...",
    "현실 경계 안정성 저하...",
    "의미 소실 구간 확장 중...",
    "비가역 단계 접근 중...",

    "관측자 개입 로그 기록 중...",
    "신적 판단 흔적 최소화 중...",
    "직접 명령 회피 프로토콜 유지...",
    "자율 서사 우선권 유지 중...",
];

const WhisperOverlay: React.FC<WhisperOverlayProps> = ({ loading, stats, factions, figures }) => {
    const [currentText, setCurrentText] = useState("");
    const [icon, setIcon] = useState<React.ReactNode>(null);

    // Helper to categorize vibe
    const currentVibeKey = useMemo(() => {
        const v = stats.culturalVibe.toLowerCase();
        if (v.includes('war') || v.includes('blood') || v.includes('death')) return 'war';
        if (v.includes('holy') || v.includes('god') || v.includes('divine')) return 'holy';
        if (v.includes('science') || v.includes('future') || v.includes('tech')) return 'science';
        if (v.includes('nature') || v.includes('forest')) return 'nature';
        if (v.includes('void') || v.includes('dark')) return 'void';
        return 'default';
    }, [stats.culturalVibe]);

    // Generate a random context-aware message
    const generateMessage = () => {
        const roll = Math.random();

        // 1. Figure Action (25%) - 살아있는 인물의 행동
        if (roll < 0.25 && figures.length > 0) {
            const aliveFigures = figures.filter(f => f.status === 'Alive');
            if (aliveFigures.length > 0) {
                const figure = aliveFigures[Math.floor(Math.random() * aliveFigures.length)];
                const actions = [
                    "당신의 뜻을 해석하려 애쓰고 있습니다...",
                    "불안한 눈빛으로 하늘을 올려다봅니다.",
                    "밀실에서 은밀한 명령을 내리고 있습니다.",
                    "자신의 운명에 대해 고뇌하고 있습니다.",
                    "오래된 기록을 뒤적이고 있습니다.",
                    "의미 없는 우연 속에서 징조를 찾고 있습니다.",
                    "침묵이 신호일지도 모른다며 토론합니다.",
                    "서로 다른 해석으로 다투고 있습니다.",
                    "기도해야 할지, 기다려야 할지 망설입니다.",
                    "결정을 미루며 책임을 신에게 돌립니다.",
                    "꿈에서 들은 목소리를 기록하고 있습니다.",
                    "자신이 선택받았다고 믿기 시작했습니다.",
                    "사소한 사건을 계시로 포장합니다.",
                    "침묵 속에서도 답을 들었다고 주장합니다.",
                    "당신의 의도를 아는 척 연설하고 있습니다.",
                    "의심을 숨긴 채 고개를 끄덕입니다.",
                    "확신 없는 명령을 따르고 있습니다.",
                    "타인의 해석을 경계합니다.",
                    "자신의 믿음이 틀릴까 두려워합니다.",
                    "의문을 입 밖에 내지 못하고 있습니다.",
                    "해석의 주도권을 잡으려 합니다.",
                    "신의 뜻을 독점하려는 움직임이 보입니다.",
                    "다른 목소리를 이단으로 규정합니다.",
                    "침묵을 자신에게 유리하게 해석합니다.",
                    "당신의 이름을 명분으로 사용합니다.",
                    "결과를 보고 의미를 거꾸로 끼워 맞춥니다.",
                    "우연이 반복되자 패턴이라 부릅니다.",
                    "패턴이 깨지자 새로운 교리를 만듭니다.",
                    "실패를 시험이라 설명합니다.",
                    "성공을 신의 승인이라 해석합니다.",
                    "결정 앞에서 책임을 회피합니다.",
                    "선택하지 않은 것을 신의 뜻이라 말합니다.",
                    "행동하지 않은 것을 신의 자비라 부릅니다.",
                    "행동한 것을 신의 명령이라 기록합니다.",
                    "모순을 의문 없이 받아들입니다.",
                    "밤마다 같은 질문을 반복합니다.",
                    "대답이 없어도 기다립니다.",
                    "기다림 자체를 신앙이라 믿습니다.",
                    "침묵에 익숙해지고 있습니다.",
                    "침묵을 두려워하기 시작했습니다.",
                    "다른 이의 행동을 징조로 해석합니다.",
                    "자연 현상을 메시지로 받아들입니다.",
                    "재난을 경고라 기록합니다.",
                    "평온을 폭풍 전의 정적이라 말합니다.",
                    "모든 것을 신의 시선으로 재단하려 합니다.",
                ];
                const action = actions[Math.floor(Math.random() * actions.length)];
                setIcon(<Users size={14} className="text-god-gold/70" />);
                return `[${figure.name}]${figure.name.endsWith('가') || figure.name.endsWith('는') ? '' : '이(가)'} ${action}`;
            }
        }

        // 2. Faction Tension (25%) - 세력 동향
        if (roll < 0.5 && factions.length > 0) {
            const activeFactions = factions.filter(f => f.power > 0);
            if (activeFactions.length > 0) {
                const faction = activeFactions[Math.floor(Math.random() * activeFactions.length)];

                if (faction.power > 70) {
                    setIcon(<Crown size={14} className="text-god-gold/70" />);
                    return `[${faction.name}]의 영향력이 절정에 달했습니다.`;
                } else if (faction.power < 20) {
                    setIcon(<Skull size={14} className="text-red-400/70" />);
                    return `[${faction.name}]의 등불이 꺼져가고 있습니다.`;
                } else {
                    const msgs = [
                        `[${faction.name}] 내부에서 논쟁이 벌어지고 있습니다.`,
                        `[${faction.name}]의 사절단이 국경을 넘었습니다.`,
                        `[${faction.name}]에서 새로운 움직임이 포착됩니다.`,

                        `[${faction.name}]의 지도부가 비공개 회합을 가졌습니다.`,
                        `[${faction.name}] 내부에서 의견이 갈리고 있습니다.`,
                        `[${faction.name}]의 정책 노선이 흔들리고 있습니다.`,
                        `[${faction.name}]에서 기존 합의가 재검토되고 있습니다.`,
                        `[${faction.name}] 내부 문서의 내용이 유출되었습니다.`,

                        `[${faction.name}]의 영향력이 주변 지역으로 확산되고 있습니다.`,
                        `[${faction.name}]의 국경 수비가 강화되었습니다.`,
                        `[${faction.name}]가 외부 세력과 접촉하고 있습니다.`,
                        `[${faction.name}]의 사절이 예정보다 오래 머물고 있습니다.`,
                        `[${faction.name}]의 태도가 이전과 달라졌다는 소문이 돌고 있습니다.`,

                        `[${faction.name}] 내부에서 강경파의 발언이 늘고 있습니다.`,
                        `[${faction.name}] 내부에서 온건파가 입지를 잃고 있습니다.`,
                        `[${faction.name}]의 결정이 지연되고 있습니다.`,
                        `[${faction.name}]의 명령 체계에 혼선이 발생했습니다.`,
                        `[${faction.name}] 내부에서 책임 공방이 벌어지고 있습니다.`,

                        `[${faction.name}]의 움직임을 경계하는 시선이 늘고 있습니다.`,
                        `[${faction.name}]의 의도를 두고 해석이 분분합니다.`,
                        `[${faction.name}]가 기존 질서를 시험하고 있습니다.`,
                        `[${faction.name}]의 행동이 주변 세력에 영향을 주고 있습니다.`,
                        `[${faction.name}]의 선택이 주목받고 있습니다.`,

                        `[${faction.name}] 내부에서 새로운 지도자가 거론되고 있습니다.`,
                        `[${faction.name}]의 지도부에 균열이 보이기 시작했습니다.`,
                        `[${faction.name}]의 권력 구도가 재편되고 있습니다.`,
                        `[${faction.name}] 내부에서 충성 경쟁이 벌어지고 있습니다.`,
                        `[${faction.name}]의 명분이 재정의되고 있습니다.`,

                        `[${faction.name}]가 조용히 병력을 재배치하고 있습니다.`,
                        `[${faction.name}]의 군사적 움직임이 포착되었습니다.`,
                        `[${faction.name}]가 대비 태세에 들어간 것으로 보입니다.`,
                        `[${faction.name}]의 행동이 우발적인지 계산된 것인지 불분명합니다.`,
                        `[${faction.name}]의 다음 선택을 예측하기 어렵습니다.`,

                        `[${faction.name}] 내부에서 불안이 확산되고 있습니다.`,
                        `[${faction.name}]의 구성원들이 서로를 경계하고 있습니다.`,
                        `[${faction.name}]의 결속력이 시험대에 올랐습니다.`,
                        `[${faction.name}] 내부 규율이 강화되고 있습니다.`,
                        `[${faction.name}]의 통제가 이전보다 엄격해졌습니다.`,

                        `[${faction.name}]의 행보가 기존 질서를 흔들고 있습니다.`,
                        `[${faction.name}]의 선택이 갈등을 촉발할 가능성이 있습니다.`,
                        `[${faction.name}]의 움직임이 하나의 신호로 해석되고 있습니다.`,
                        `[${faction.name}]의 침묵이 오히려 주목받고 있습니다.`,
                        `[${faction.name}]가 결정을 앞두고 있는 듯 보입니다.`
                    ];
                    setIcon(<Activity size={14} className="text-blue-400/70" />);
                    return msgs[Math.floor(Math.random() * msgs.length)];
                }
            }
        }

        // 3. System Log (10%) - 메타적인 느낌
        if (roll < 0.6) {
            setIcon(<Sparkles size={14} className="text-purple-400/70 animate-pulse" />);
            return SYSTEM_LOGS[Math.floor(Math.random() * SYSTEM_LOGS.length)];
        }

        // 4. Vibe Atmosphere (40%) - 기본 분위기
        const vibeTexts = VIBE_WHISPERS[currentVibeKey] || VIBE_WHISPERS['default'];
        setIcon(<Wind size={14} className="text-slate-400/70" />);
        return vibeTexts[Math.floor(Math.random() * vibeTexts.length)];
    };

    useEffect(() => {
        if (loading) {
            // Initial message
            const msg = generateMessage();
            setCurrentText(msg);

            // Interval
            const interval = setInterval(() => {
                const nextMsg = generateMessage();
                setCurrentText(nextMsg);
            }, 3500); // Change text every 3.5 seconds

            return () => clearInterval(interval);
        }
    }, [loading]); // Re-run only when loading starts

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-end pb-12 md:pb-16 pointer-events-none bg-gradient-to-t from-[#020617]/90 via-transparent to-transparent"
                >
                    <div className="relative w-full max-w-md px-6 text-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentText}
                                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                className="flex flex-col items-center gap-2"
                            >
                                {/* Decorative Icon */}
                                <div className="mb-1 p-2 rounded-full bg-black/30 border border-white/5 backdrop-blur-sm shadow-lg">
                                    {icon || <Wind size={14} className="text-slate-400" />}
                                </div>

                                {/* Text */}
                                <p className="font-serif text-slate-200 text-sm md:text-base leading-relaxed tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    "{currentText}"
                                </p>

                                {/* Loading Indicator Line */}
                                <motion.div
                                    className="h-px bg-gradient-to-r from-transparent via-god-gold/50 to-transparent w-24 mt-4"
                                    animate={{ scaleX: [0.5, 1.5, 0.5], opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WhisperOverlay;
