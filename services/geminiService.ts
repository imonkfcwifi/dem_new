
import { GoogleGenAI, Type } from "@google/genai";
import { Faction, WorldStats, LogEntry, SimulationResult, LogType, Person } from "../types";

export type AIProvider = 'gemini' | 'claude';

let genAI: GoogleGenAI | null = null;
let currentProvider: AIProvider = 'gemini';
let apiKey: string | null = null;

// CONFIG: Set to true to enable AI image generation for characters.
// Set to false to save tokens/costs.
export const ENABLE_PORTRAIT_GENERATION = false;

export const initializeAI = (key?: string, provider: AIProvider = 'gemini') => {
  currentProvider = provider;
  // Prefer process.env.API_KEY as per coding guidelines
  const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  apiKey = key || localStorage.getItem(provider === 'gemini' ? 'user_gemini_api_key' : 'user_claude_api_key') || envKey || "";

  if (!apiKey) return false;

  // Save key
  if (key) {
    localStorage.setItem(provider === 'gemini' ? 'user_gemini_api_key' : 'user_claude_api_key', key);
    localStorage.setItem('ai_provider', provider);
  }

  if (provider === 'gemini') {
    try {
      genAI = new GoogleGenAI({ apiKey: apiKey });
      return true;
    } catch (e) {
      console.error("Failed to init Gemini", e);
      return false;
    }
  }
  return true; // Claude uses direct fetch
};

export const generatePortrait = async (person: Person): Promise<string | null> => {
  // Check global config first
  if (!ENABLE_PORTRAIT_GENERATION) {
    return null;
  }

  if (!apiKey) return null;

  if (currentProvider === 'claude') {
    console.warn("Claude does not support image generation directly in this version.");
    return null;
  }

  try {
    if (!genAI) initializeAI();
    const prompt = `A highly detailed, oil-painting style portrait of a fantasy character.
        Name: ${person.name}
        Role: ${person.role}
        Faction: ${person.factionName}
        Traits: ${person.traits.join(', ')}
        Description: ${person.description}
        Era: Ancient/Medieval Fantasy mixed with Sci-Fi elements.
        Style: Dark, gritty, realistic, cinematic lighting, 8k resolution.
        Head and shoulders shot.`;

    const response = await genAI!.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Portrait
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Portrait generation failed", e);
    return null;
  }
};

export const advanceSimulation = async (
  stats: WorldStats,
  factions: Faction[],
  figures: Person[],
  logs: LogEntry[],
  playerCommand: string | null,
  decisionChoice: string | null,
  yearsToAdvance: number
): Promise<SimulationResult> => {
  if (!apiKey) {
    return {
      newYear: stats.year,
      populationChange: 0,
      logs: [{ id: 'err', year: stats.year, type: LogType.SYSTEM, content: "API Key Missing. Please configure in settings." }],
      factions: factions,
      updatedFigures: [],
      stats: {},
      pendingDecision: null
    };
  }

  // OPTIMIZATION: Limit log context
  const recentLogs = logs.slice(-15).map(l => `[Year ${l.year}] ${l.content}`).join("\n");
  const factionSummary = factions.map(f => `[${f.name}] Power:${f.power} Faith:${f.attitude} Tenets:${f.tenets.join(',')}`).join("\n");

  // OPTIMIZATION: Filter figures to prevent token explosion.
  // Only send Alive figures + Recently Dead (within 20 years) to maintain context without indefinite growth.
  const relevantFigures = figures.filter(p =>
    p.status === 'Alive' || (p.deathYear && stats.year - p.deathYear < 20)
  );

  const figureSummary = relevantFigures.map(p =>
    `[ID: ${p.id}] Name: ${p.name} (Faction: ${p.factionName}, Role: ${p.role}, Age: ${stats.year - p.birthYear}, Status: ${p.status})`
  ).join("\n");

  const systemPrompt = `
    You are the High Chronicler and Engine of Reality.
    **The USER (the player) is the "Silent God" (침묵하는 신).**
    
    [ CURRENT REALITY ]
    YEAR: ${stats.year} (Target: ${stats.year + yearsToAdvance})
    ERA: ${stats.technologicalLevel} (Vibe: ${stats.culturalVibe})
    POPULATION: ${stats.population}
    
    [ HISTORY & CONTEXT ]
    ${recentLogs}
    
    [ FACTIONS ]
    ${factionSummary}

    [ KEY FIGURES (Active Only) ]
    ${figureSummary}

    ==================================================
    [ THE DIVINE WILL (USER INPUT) ]
    ==================================================
    
    STATUS: ${playerCommand || decisionChoice ? "**DIVINE INTERVENTION**" : "**DIVINE SILENCE**"}

    ${playerCommand
      ? `THE GOD HAS SPOKEN: "${playerCommand}"
         INSTRUCTION: This is a DECREE. Reality MUST bend immediately. 
         If it is a miracle, describe the awe. If it is destruction, describe the terror.
         The logs MUST explicitly reflect that this event was caused by the God's will.`
      : decisionChoice
        ? `THE GOD HAS ANSWERED A PRAYER: "${decisionChoice}"
         INSTRUCTION: The fate of the petitioner is sealed.`
        : `THE GOD WATCHES IN SILENCE.
         INSTRUCTION: The mortals are left to their own Free Will.
         The world should evolve naturally, tending towards complexity, desire, and conflict.`
    }

    ==================================================
    [ CORE SIMULATION RULES (STRICT ENFORCEMENT) ]
    ==================================================

    1. **PROTOCOL: ANTI-NIHILISM (NO DEATH SPIRALS)**
       - **ABSOLUTELY FORBIDDEN:** Do NOT write logs about "eternal nothingness", "time losing meaning", or "the void reigning forever".
       - **FORCED REBIRTH:** If the world is destroyed, wiped out, or the population hits 0, **IMMEDIATELY** describe the rise of a new weird lifeform (mutants, silicon life, deep sea dwellers).
       - *Example:* Instead of "Everything vanished," write "From the ashes of the old world, the 'Rust Eaters' crawled out, worshipping the radiation."

    2. **PROTOCOL: LAW OF OVERPOPULATION (DENSITY)**
       - The world feels empty. **YOU MUST FILL IT.**
       - **MANDATORY:** Generate **at least 2-3 NEW FIGURES** every single turn in the 'updatedFigures' array.
       - **MINIMUM ROSTER:** Every faction MUST have at least 3 active figures (Leader, General, Spy/Priest). If a faction has less, SPAWN THEM NOW.
       - Introduce them with drama: "A new bastard child claims the throne," "A genius heretic rises from the slums."

    3. **PROTOCOL: FACTION SPLINTERING & GENESIS**
       - **NO VACUUM:** If a faction dies, a new one must rise in its place or a neighbor must annex it.
       - **TOO BIG TO FAIL? NO.** If a Faction has > 70 Power, it is UNSTABLE. Trigger a **Civil War** or **Schism**. Split it into two factions (e.g., "The Golden Empire" -> "The Golden Loyalists" vs "The Iron Separatists").
       - Create new factions often. Use specific names (e.g., "The Cult of the Red Moon", "The Cyber-Druids").

    4. **SECRETS & DESIRE (MATURE & TABOO)**
       - **DO NOT be polite.** History is driven by lust, greed, and madness.
       - Generate secrets that are **Ironies, Taboos, or Hypocrisies**.
       - **Examples of Valid Secrets (Apply these vibes):**
         - "The High Priest is addicted to hallucinogenic rituals to feel 'divine'." (Addiction)
         - "The General has a secret masochistic desire to be defeated/tortured." (Fetish)
         - "The Queen is secretly carrying the child of the enemy King." (Forbidden/Political Scandal)
         - "The Hero is actually a coward who pays bards to lie about his deeds." (Fraud)
         - "The Saint is in a polyamorous relationship with her guards." (Lust)
       - **Severity:** 'Fatal' secrets should be world-shaking (e.g., illegitimate heir, heresy).
        - The world may contain **Prohibited relationships, covert romance, political scandals, secret lovers, desire-based conflicts, etc.
       -it produces explicit sexual descriptions, direct sexual expressions of the body, and detailed descriptions of obscene behavior.
       * "Secret Meeting", "Late Secret Talk", "Relationship that was secretly connected to no one"
       * "A dangerous relationship where power and desire are mixed."
       * "A secret lover who has political repercussions as forbidden emotions grow."
       * "Traces of each other's rooms", "Secretly exchanged letters"
       * "A deadly scandal that will lead to ruin if it is revealed."

    5. **Tone & Style**
       - Language: **Korean (한국어)**.
       - Tone: Biblical, Mythic, but **Visceral** (Raw). Describe blood, gold, sweat, and whispers.
       - Endings: Archaic (~하였더라) for Scripture logs.

    6. **LAW OF ORGANIC POPULATION (CRITICAL)**
       - **Do NOT limit figures to a fixed number.**
       - If a faction is powerful (>50 Power) but has few leaders, **SPAWN NEW ONES**.
       - If a faction is at war, SPAWN a General.
       - If a faction is undergoing a revolution, SPAWN a Rebel Leader.
       - **NEVER** let the world feel empty. Fill it with ambitious new souls.

    7. **CHAOS SPAWNING (Events Create People)**
       - If a "War", "Plague", "Schism", or "Discovery" happens in the logs:
       - You **MUST** create a new character responsible for or affected by it.
       - *Example:* "A great plague spreads." -> Create "Doctor Vian, the Mad Alchemist who spreads it."

    8. **Transformation over Extinction**
       - **NEVER** delete a faction just because Power hits 0.
       - Instead, **TRANSFORM** it. A fallen empire becomes a "Remnant", a "Cult", or a "Resistance".
       - Update the faction's 'name' and 'description' to reflect this fall.

    9. **PROTOCOL: DIVINE PETITIONS (INTERACTIVITY - IMPORTANT)**
       - **FREQUENCY:** roughly **40% chance** per turn (or 100% if a major crisis occurs), a major figure MUST pray to the Silent God.

    ==================================================
    [ OUTPUT FORMAT (JSON ONLY) ]
    ==================================================
    
    Return VALID JSON. No Markdown.
    
    {
      "logs": [
        { 
          "year": number, 
          "type": "SCRIPTURE" (Divine Acts) | "HISTORICAL" (Political/War) | "CULTURAL" (Tech/Society), 
          "content": "String (Korean)" 
        }
      ],
      "factions": [
        { 
          "name": "String", 
          "power": number (0-100), 
          "attitude": number (-100 to 100), 
          "color": "HexCode", 
          "tenets": ["String"], 
          "description": "Updated description", 
          "history": "Updated history" 
        }
      ],
      "updatedFigures": [
         { 
           "id": "String (Keep existing ID if updating, generate 'new-{name}-{year}' for new)", 
           "name": "String", 
           "factionName": "String", 
           "role": "String", 
           "status": "Alive" | "Dead", 
           "description": "Summary", 
           "biography": "Updated Life Story",
           "birthYear": number, 
           "deathYear": number | null,
           "traits": ["String"],
           "secrets": [
             { "id": "String", "title": "String", "description": "String (Make it Spicy/Taboo)", "severity": "Gossip"|"Scandal"|"Fatal" }
           ],
           "relationships": [
             { "targetId": "String", "targetName": "String", "type": "String", "value": number, "description": "Context", "isSecret": boolean }
           ]
         }
      ],
      "stats": { 
        "populationChange": number, 
        "technologicalLevel": "String", 
        "culturalVibe": "String" 
      },
      "pendingDecision": { 
          "id": "String", 
          "senderName": "String", 
          "senderRole": "String",
          "message": "String (Archaic prayer)",
          "options": [
              { "id": "String", "text": "String", "consequenceHint": "String" }
          ]
      }
    }
  `;

  try {
    if (!genAI) initializeAI();

    const response = await genAI!.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Execute the Divine Will. Populate the world. Prevent the void.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(jsonStr) as SimulationResult;

    if (!result.logs) result.logs = [];
    if (!result.factions) result.factions = factions;
    if (!result.updatedFigures) result.updatedFigures = [];
    if (!result.stats) result.stats = {};

    result.logs.forEach(l => {
      if (!l.id) l.id = `log-${Date.now()}-${Math.random()}`;
      if (!l.year) l.year = stats.year + yearsToAdvance;
    });

    result.factions.forEach(f => {
      f.power = Math.max(0, Math.min(100, f.power));
      f.attitude = Math.max(-100, Math.min(100, f.attitude));
    });

    return {
      ...result,
      newYear: stats.year + yearsToAdvance,
      populationChange: (result.stats as any).populationChange || 0
    };

  } catch (e) {
    console.error("Simulation Error", e);
    return {
      newYear: stats.year,
      populationChange: 0,
      logs: [{
        id: 'err',
        year: stats.year,
        type: LogType.SYSTEM,
        content: "신탁이 흐려져 역사가 잠시 멈추었습니다. (AI 응답 오류: 잠시 후 다시 시도하십시오)"
      }],
      factions: factions,
      updatedFigures: [],
      stats: {},
      pendingDecision: null
    };
  }
};