

export class AudioService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private enabled: boolean = true;
    private initialized: boolean = false;
    private bgm: HTMLAudioElement | null = null;

    // Volume states
    private bgmVolume: number = 0.3;
    private sfxVolume: number = 0.5;

    constructor() {
        if (typeof window !== 'undefined') {
            this.enabled = localStorage.getItem('god_mode_sound') !== 'false';

            // Load saved volumes
            const savedBgm = localStorage.getItem('settings_bgm_vol');
            const savedSfx = localStorage.getItem('settings_sfx_vol');

            if (savedBgm) this.bgmVolume = parseFloat(savedBgm);
            if (savedSfx) this.sfxVolume = parseFloat(savedSfx);
        }
    }

    private init() {
        if (this.initialized || typeof window === 'undefined') return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 1.0; // Master output is 1.0, controlled at source
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.error("Audio initialization failed", e);
        }
    }

    public async resume() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    public toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('god_mode_sound', String(this.enabled));

        if (this.bgm) {
            if (this.enabled) {
                this.bgm.play().catch(e => console.warn("BGM resume failed:", e));
            } else {
                this.bgm.pause();
            }
        }
        return this.enabled;
    }

    public isEnabled() {
        return this.enabled;
    }

    // --- Volume Controls ---

    public setBGMVolume(val: number) {
        this.bgmVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('settings_bgm_vol', String(this.bgmVolume));
        if (this.bgm) {
            this.bgm.volume = this.bgmVolume;
        }
    }

    public setSFXVolume(val: number) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('settings_sfx_vol', String(this.sfxVolume));
    }

    public getBGMVolume() { return this.bgmVolume; }
    public getSFXVolume() { return this.sfxVolume; }

    // --- BGM ---
    public playBGM() {
        if (typeof window === 'undefined') return;

        if (!this.bgm) {
            this.bgm = new Audio('/deus_bgm.mp3');
            this.bgm.loop = true;
        }

        this.bgm.volume = this.bgmVolume;

        if (this.enabled) {
            this.bgm.play().catch(e => {
                console.warn("BGM autoplay prevented (waiting for interaction):", e);
            });
        }
    }

    // --- Sound Effects ---

    public playClick() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

        // Apply SFX Volume
        const vol = 0.15 * this.sfxVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    public playHover() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);

        // Apply SFX Volume
        const vol = 0.02 * this.sfxVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    public playTurnStart() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 1.2);

        // Apply SFX Volume
        const vol = 0.6 * this.sfxVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.2);
    }

    public playDivinePresence() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const freqs = [523.25, 659.25, 783.99, 1046.50];
        const now = this.ctx.currentTime;

        freqs.forEach((f, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'triangle';
            osc.frequency.value = f;

            osc.connect(gain);
            gain.connect(this.masterGain!);

            const start = now + i * 0.08;
            // Apply SFX Volume
            const vol = 0.08 * this.sfxVolume;

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(vol, start + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 2.5);

            osc.start(start);
            osc.stop(start + 2.5);
        });
    }

    public playSuccess() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);

        // Apply SFX Volume
        const vol = 0.1 * this.sfxVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    public playCrack() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        // Simulate Noise/Crack
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5s duration
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // White noise with random spikes
            data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.9 ? 1 : 0.2);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        noise.connect(gain);
        gain.connect(this.masterGain);

        // Sharp sharp decay
        gain.gain.setValueAtTime(0.8 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        noise.start();
        noise.stop(this.ctx.currentTime + 0.5);
    }
}

export const audio = new AudioService();