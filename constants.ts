
import { Person } from "./types";

export const APP_VERSION = "v1.2.0";

export const THEMES = {
  default: {
    id: 'default',
    colors: {
      primary: '#D4AF37', // Gold
      dim: '#8a701e',
      accent: '#38BDF8',
      bgStart: '#1e293b',
      bgEnd: '#020617'
    },
    fontDisplay: '"Cinzel"'
  },
  scientific: {
    id: 'scientific',
    colors: {
      primary: '#22d3ee', // Cyan
      dim: '#0e7490',
      accent: '#38bdf8',
      bgStart: '#0f172a',
      bgEnd: '#082f49'
    },
    fontDisplay: '"Inter"'
  },
  theocratic: {
    id: 'theocratic',
    colors: {
      primary: '#fcd34d', // Amber
      dim: '#b45309',
      accent: '#fbbf24',
      bgStart: '#2a1b00',
      bgEnd: '#0f0500'
    },
    fontDisplay: '"Cinzel"'
  },
  war: {
    id: 'war',
    colors: {
      primary: '#f87171', // Red
      dim: '#991b1b',
      accent: '#fca5a5',
      bgStart: '#2a0a0a',
      bgEnd: '#0f0505'
    },
    fontDisplay: '"Cinzel"'
  },
  nature: {
    id: 'nature',
    colors: {
      primary: '#4ade80', // Green
      dim: '#166534',
      accent: '#86efac',
      bgStart: '#052e16',
      bgEnd: '#020617'
    },
    fontDisplay: '"Crimson Text"'
  },
  void: {
    id: 'void',
    colors: {
      primary: '#c084fc', // Purple
      dim: '#6b21a8',
      accent: '#e879f9',
      bgStart: '#1e1b4b',
      bgEnd: '#020617'
    },
    fontDisplay: '"Inter"'
  }
};

export const getThemeForVibe = (vibe: string) => {
  const v = (vibe || "").toLowerCase();

  if (v.includes('science') || v.includes('future') || v.includes('tech')) return THEMES.scientific;
  if (v.includes('holy') || v.includes('god') || v.includes('divine') || v.includes('theocra')) return THEMES.theocratic;
  if (v.includes('war') || v.includes('blood') || v.includes('death')) return THEMES.war;
  if (v.includes('nature') || v.includes('forest') || v.includes('life')) return THEMES.nature;
  if (v.includes('void') || v.includes('dark') || v.includes('night') || v.includes('star')) return THEMES.void;

  return THEMES.default;
};

export interface FactionLore {
  description: string;
  history: string;
  beliefs: string[];
  initialFigures: Person[];
}

export const FACTION_LORE_DATA: Record<string, FactionLore> = {
  "아우레아 성황청": {
    description: "대륙 중앙의 비옥한 황금 평원을 지배하는 신정 국가입니다. 이들은 '침묵하는 신'을 숭배하며, 신의 침묵을 질서에 대한 묵인으로 해석합니다. 거대한 황금 대성당을 중심으로 완벽한 관료제와 법률이 사회를 통제하며, 모든 시민은 태어날 때부터 정해진 역할을 수행합니다.",
    history: "혼돈의 시대 이후, 최초의 예언자 '아우렐리우스'가 신의 계시를 받아 건국했습니다. 그는 '질서만이 구원이다'라고 설파하며 유랑민들을 규합했고, 황금 가면을 쓴 사제들이 통치하는 제국을 건설했습니다. 300년 전 '대분열' 당시 이단 심문소를 설립하여 내부의 적을 숙청한 역사가 있습니다.",
    beliefs: ["신성 관료제: 모든 행정 절차는 신성한 의식이다.", "절대 질서: 예외 없는 법 적용이 곧 정의다.", "침묵의 해석: 신이 침묵하는 것은 우리가 올바르다는 증거다."],
    initialFigures: [
      {
        id: "fig-ignatius",
        name: "대주교 이그나티우스",
        factionName: "아우레아 성황청",
        role: "대주교 (High Bishop)",
        description: "황금 가면 뒤에 표정을 숨긴 냉철한 통치자. 법전의 토씨 하나도 틀리는 것을 용납하지 않는다.",
        biography: "이그나티우스는 하급 서기관 출신으로, 오직 암기력과 충성심만으로 대주교의 자리에 올랐다. 그는 감정이 결여된 판결로 유명하며, 자신의 친동생조차 이단 혐의로 처형했다는 소문이 있다. 그가 원하는 것은 신의 사랑이 아니라, 신의 통제된 세계다.",
        birthYear: 45,
        status: "Alive",
        traits: ["냉혹함", "완벽주의", "법률가"],
        relationships: [],
        secrets: [{
          id: "sec-ignatius-1",
          title: "가면의 비밀",
          description: "그는 사실 심각한 화상을 입어 얼굴이 녹아내렸다. 이는 과거 금지된 마법 서적을 태우다 발생한 사고다.",
          severity: "Scandal",
          knownBy: []
        }]
      },
      {
        id: "fig-seraphina",
        name: "성녀 세라피나",
        factionName: "아우레아 성황청",
        role: "성녀 (Saint)",
        description: "민중에게 기적을 행하는 치유사. 성황청의 엄격함 속에서 유일하게 자비를 베푸는 존재.",
        biography: "빈민가에서 태어난 고아였으나, 그녀의 손길이 닿은 병자들이 낫는 기적이 목격되어 성녀로 추대되었다. 그러나 그녀는 성황청의 부패와 가혹함에 점차 회의를 느끼고 있다. 밤마다 몰래 평민들의 고해성사를 들어주며 성황청이 금지한 '개인의 기도'를 허용하고 있다.",
        birthYear: 82,
        status: "Alive",
        traits: ["자비로움", "의심", "치유"],
        relationships: [],
        secrets: []
      }
    ]
  },
  "침묵의 감시자들": {
    description: "북부의 영구 동토층에 위치한 거대한 도서관 요새 '이클립스'를 지키는 수도승 집단입니다. 이들은 세상의 모든 사건을 기록하지만, 그 과정에 개입하지 않는 것을 절대적인 규율로 삼습니다. 엔트로피의 증가와 세상의 멸망조차도 담담히 기록해야 할 역사라고 믿습니다.",
    history: "고대 문명이 멸망할 때, 지식을 보존하기 위해 지하 벙커로 피신한 학자들이 시초입니다. 그들은 바깥세상이 불타는 것을 보며 '개입은 곧 왜곡이다'라는 교훈을 얻었습니다. 이후 그들은 눈을 멀게 하거나 혀를 자르는 고행을 통해 관찰자로서의 객관성을 유지하려 합니다.",
    beliefs: ["기록 보존: 기억되지 않는 것은 존재하지 않는 것이다.", "절대 중립: 선과 악은 기록의 소재일 뿐이다.", "엔트로피 숭배: 멸망은 완성의 단계다."],
    initialFigures: [
      {
        id: "fig-zero",
        name: "기록관 제로",
        factionName: "침묵의 감시자들",
        role: "수석 기록관 (Grand Archivist)",
        description: "스스로 두 눈을 파내고 마법적인 시야를 얻은 노인. 물리적인 빛 대신 역사의 인과율을 본다.",
        biography: "제로는 감시자들 중에서도 가장 오래된 인물이다. 그는 자신의 눈을 제물로 바쳐 과거와 현재를 동시에 보는 능력을 얻었다. 그는 누구와도 대화하지 않으며 오직 깃펜을 움직이는 소리만을 낸다. 그가 기록하는 책은 '종말의 서'라고 불리며, 마지막 페이지가 언제 쓰일지는 아무도 모른다.",
        birthYear: 12,
        status: "Alive",
        traits: ["맹인", "예언자", "침묵"],
        relationships: [],
        secrets: []
      }
    ]
  },
  "유리 연금술 학회": {
    description: "남부의 작열하는 태양 사막에 위치한 기술 관료 집단입니다. 이들은 모래를 녹여 만든 거대한 유리 돔 도시에서 살아가며, 태양 에너지를 동력원으로 사용합니다. 전통적인 마법을 거부하고 실험과 증명을 중시하는 과학적 사고방식을 가지고 있습니다.",
    history: "사막의 유목민들이 고대의 태양광 발전 시설을 발굴하면서 시작되었습니다. 그들은 태양을 신이 아닌 '무한한 에너지원'으로 정의했고, 이를 이용해 사막을 낙원으로 개조하려 했습니다. 그러나 과도한 실험으로 인해 주변 지역이 유리 결정으로 뒤덮이는 부작용을 겪고 있습니다.",
    beliefs: ["등가교환: 공짜 기적은 없다.", "지식의 공유: 모든 발견은 검증되어야 한다.", "태양 숭배: 태양은 가장 거대한 용광로다."],
    initialFigures: [
      {
        id: "fig-solaris",
        name: "수석 연금술사 솔라리스",
        factionName: "유리 연금술 학회",
        role: "학회장 (Grand Alchemist)",
        description: "투명한 유리 의수를 가진 천재 공학자. 감정보다는 효율을 중시한다.",
        biography: "솔라리스는 어릴 적 실험 사고로 오른팔을 잃었으나, 직접 설계한 태양광 구동 유리 의수를 장착하여 더 정교한 작업을 수행할 수 있게 되었다. 그녀는 인간의 육체 또한 개조 가능한 기계라고 생각하며, 학회원들에게 신체 개조를 장려한다.",
        birthYear: 68,
        status: "Alive",
        traits: ["천재", "매드 사이언티스트", "실용주의"],
        relationships: [],
        secrets: []
      }
    ]
  },
  "강철뿌리 숲": {
    description: "서부의 울창한 숲은 단순한 자연이 아닙니다. 과거 대전쟁 시절 버려진 기계 병기들이 식물과 융합하여 기괴한 생태계를 이루었습니다. 이곳의 드루이드들은 나뭇가지 대신 전선을, 뼈 대신 강철을 숭배하며, 기계와 자연의 결합을 진화라고 믿습니다.",
    history: "오염된 땅을 정화하려던 자연주의자들이 오히려 오염 물질에 적응하면서 변이했습니다. 그들은 숲에 버려진 AI 코어를 '어머니 나무'라고 부르며 섬기기 시작했고, 스스로의 몸에 기계를 이식하여 숲과 동화되었습니다. 이들은 문명을 파괴하려는 것이 아니라, 문명을 야생으로 되돌리려 합니다.",
    beliefs: ["기계 공생: 강철은 뼈요, 수액은 피다.", "적자생존: 약한 부품은 폐기된다.", "기술의 야생화: 기계도 생명이다."],
    initialFigures: [
      {
        id: "fig-gaia7",
        name: "대드루이드 가이아-7",
        factionName: "강철뿌리 숲",
        role: "대드루이드 (Archdruid)",
        description: "절반은 인간, 절반은 식물과 기계가 뒤엉킨 존재. 숲의 네트워크와 연결되어 있다.",
        biography: "가이아-7은 원래 인간이었으나, 숲의 중추 신경망인 '어머니 나무'와 접속하기 위해 뇌의 대부분을 전자화했다. 그녀는 숲의 모든 감각을 공유하며, 침입자가 발생하면 나무뿌리(광섬유)를 조종해 처단한다. 그녀에게 인간성은 불필요한 구형 소프트웨어일 뿐이다.",
        birthYear: 55,
        status: "Alive",
        traits: ["사이보그", "자연주의", "수호자"],
        relationships: [],
        secrets: []
      }
    ]
  },
  "심해 무역연합": {
    description: "대륙 주변의 해안과 섬들을 연결하는 거대한 상인 연합입니다. 이들은 국가라기보다는 거대한 기업에 가까우며, 돈과 계약을 신성시합니다. 심해에 잠긴 고대 유적을 탐사하여 보물을 찾아내고, 세상의 모든 물자를 유통합니다.",
    history: "해적과 밀수업자들이 연합하여 해군을 격파하고 자치권을 획득했습니다. 이후 그들은 무력을 통한 약탈보다 무역을 통한 지배가 더 효율적임을 깨달았습니다. 현재 그들은 대륙의 금융을 장악하고 있으며, 용병들을 고용해 치안을 유지합니다.",
    beliefs: ["황금 만능: 모든 것에는 가격이 있다.", "계약 신성: 약속은 목숨보다 무겁다.", "모험심: 미지의 바다에 부가 있다."],
    initialFigures: [
      {
        id: "fig-barbarossa",
        name: "무역왕 바르바로사",
        factionName: "심해 무역연합",
        role: "제독 (Admiral)",
        description: "붉은 수염을 기른 호탕한 뱃사람. 전직 해적왕 출신으로, 바다 위에서는 무적이다.",
        biography: "바르바로사는 한때 악명 높은 해적이었으나, 성황청의 전쟁에서 승리한 후 협상을 통해 무역연합의 초대 의장이 되었다. 그는 거친 외모와 달리 치밀한 계산 능력을 가지고 있으며, 대륙의 왕들조차 그에게 빚을 지고 있다. 그는 바다 괴수의 뼈로 만든 거대한 배 '레비아탄'을 타고 다닌다.",
        birthYear: 60,
        status: "Alive",
        traits: ["카리스마", "부호", "모험가"],
        relationships: [],
        secrets: []
      }
    ]
  },
  "공허의 직조공": {
    description: "동부의 안개 낀 군도에 숨어 사는 신비주의 집단입니다. 이들은 밤하늘의 별을 관측하며 우주의 허무와 종말을 연구합니다. 그들은 이 세계가 '깨어날 꿈'에 불과하며, 진정한 해방은 존재의 소멸에 있다고 믿습니다.",
    history: "별을 숭배하던 고대 종교가 변질되어 탄생했습니다. 그들은 망원경을 통해 우주 바깥의 '검은 존재'들과 접촉했고, 그들의 속삭임을 교리로 삼았습니다. 사회적으로 배척받지만, 점성술과 저주에 탁월한 능력을 보여 왕족들이 은밀하게 그들을 찾기도 합니다.",
    beliefs: ["허무주의: 모든 노력은 먼지로 돌아간다.", "운명론: 별들의 위치가 모든 것을 결정한다.", "심연의 응시: 어둠을 직시하라."],
    initialFigures: [
      {
        id: "fig-luna",
        name: "점성술사 루나",
        factionName: "공허의 직조공",
        role: "예언자 (Oracle)",
        description: "눈동자가 우주처럼 검은 소녀. 항상 몽환적인 상태에 빠져 있다.",
        biography: "루나는 태어날 때부터 울지 않고 밤하늘을 응시했다고 전해진다. 그녀는 별들의 배열을 보고 국가의 흥망성쇠를 예언하며, 그녀의 예언은 섬뜩할 정도로 정확하다. 그녀는 자신이 이 세상에 속하지 않는다고 느끼며, 언젠가 별들이 내려와 자신을 데려갈 것이라고 믿는다.",
        birthYear: 90,
        status: "Alive",
        traits: ["신비주의", "정신이상", "매력"],
        relationships: [],
        secrets: []
      }
    ]
  }
};

export interface RegionInfo {
  title: string;
  description: string;
  coordinates: { x: number, y: number };
}

export const REGION_INFO: Record<string, RegionInfo> = {
  "Center": {
    title: "황금 평원 (Golden Plains)",
    description: "아우레아 성황청의 본거지. 끝없이 펼쳐진 밀밭과 황금으로 장식된 도시들이 있다. 신의 축복을 받은 가장 풍요로운 땅이지만, 감시의 눈길이 가장 심한 곳이기도 하다.",
    coordinates: { x: 50, y: 50 }
  },
  "North": {
    title: "영구 동토층 (Permafrost)",
    description: "침묵의 감시자들이 지키는 얼어붙은 땅. 고대의 유적들이 빙하 아래 잠들어 있으며, 살을 에는 추위 때문에 일반인은 접근하기 어렵다.",
    coordinates: { x: 50, y: 20 }
  },
  "South": {
    title: "작열하는 사막 (Scorching Desert)",
    description: "유리 연금술 학회의 영토. 태양열로 인해 모래가 녹아내려 곳곳에 천연 유리가 형성되어 있다. 낮에는 타는 듯이 뜨겁고 밤에는 얼어붙는 극한의 환경.",
    coordinates: { x: 50, y: 80 }
  },
  "West": {
    title: "뒤틀린 숲 (Twisted Forest)",
    description: "강철뿌리 숲의 영역. 나무들은 강철 껍질을 두르고 있고, 강물 대신 기름이 흐른다. 기계와 자연이 융합된 기괴한 몬스터들이 서식한다.",
    coordinates: { x: 20, y: 50 }
  },
  "East": {
    title: "안개 군도 (Mist Isles)",
    description: "공허의 직조공들의 은신처. 일 년 내내 짙은 안개가 끼어 있어 항해가 어렵다. 밤이 되면 별빛이 기이하게 굴절되어 보인다.",
    coordinates: { x: 80, y: 50 }
  },
  "Coast": {
    title: "자유 무역항 (Free Ports)",
    description: "심해 무역연합의 거점. 대륙 각지의 물자가 모이는 거대한 항구 도시들이다. 밤에도 불이 꺼지지 않으며, 돈만 있다면 무엇이든 구할 수 있다.",
    coordinates: { x: 70, y: 70 }
  }
};

export const generateInitialPeople = (): Person[] => {
  return Object.values(FACTION_LORE_DATA).flatMap(lore => lore.initialFigures);
};