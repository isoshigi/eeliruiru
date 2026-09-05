// 音源ファイル優先 AudioManager（欠落時は Web Audio 合成分岐）
// 元: public/app.js SoundFX（非純粋: AudioContext / HTMLAudio / setInterval）
// 数値計算のみ pure/audioLogic.ts に切り出し、ここでは副作用を扱う。

import { getBgmNoteFreq, getPerfectPullNotes, sizzleBaseFreq } from "../pure/audioLogic.js";

export const AUDIO_FILES = {
  bgm: "/assets/audio/bgm.mp3",
  sizzle: "/assets/audio/sizzle.mp3",
  trash: "/assets/audio/trash.mp3",
  dolphin: "/assets/audio/dolphin.mp3",
  pull: "/assets/audio/pull.mp3",
  miss: "/assets/audio/miss.mp3",
} as const;

type SeName = "sizzle" | "trash" | "dolphin" | "pull" | "miss";

export class SoundFX {
  ctx: AudioContext | null = null;
  bgmEnabled = false;
  bgmInterval: ReturnType<typeof setInterval> | null = null;
  noteIndex = 0;
  fileAudio: { bgm: HTMLAudioElement; pools: Record<SeName, HTMLAudioElement[]> } | null = null;
  fileOk: Partial<Record<SeName | "bgm", boolean>> = {};
  seCursor: Record<SeName, number> = { sizzle: 0, trash: 0, dolphin: 0, pull: 0, miss: 0 };

  ensureFileAudio(): void {
    if (this.fileAudio || typeof window === "undefined" || typeof window.Audio === "undefined") return;
    try {
      const mk = (src: string, volume: number): HTMLAudioElement => {
        const el = new window.Audio(src);
        el.preload = "auto";
        el.volume = volume;
        return el;
      };
      const pools = {} as Record<SeName, HTMLAudioElement[]>;
      const entries: Array<[SeName, number]> = [
        ["sizzle", 0.5],
        ["trash", 0.5],
        ["dolphin", 0.6],
        ["pull", 0.6],
        ["miss", 0.6],
      ];
      for (const [name, volume] of entries) {
        pools[name] = [mk(AUDIO_FILES[name], volume), mk(AUDIO_FILES[name], volume), mk(AUDIO_FILES[name], volume)];
        pools[name].forEach((el) => {
          el.addEventListener("error", () => {
            this.fileOk[name] = false;
          });
          el.addEventListener("canplaythrough", () => {
            if (this.fileOk[name] !== false) this.fileOk[name] = true;
          });
        });
        this.seCursor[name] = 0;
      }
      const bgm = mk(AUDIO_FILES.bgm, 0.35);
      bgm.loop = true;
      bgm.addEventListener("error", () => {
        this.fileOk.bgm = false;
      });
      bgm.addEventListener("canplaythrough", () => {
        if (this.fileOk.bgm !== false) this.fileOk.bgm = true;
      });
      this.fileAudio = { bgm, pools };
    } catch (e) {
      /* file audio unsupported -> synth only */
    }
  }

  init(): void {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch (e) {
        /* no audio */
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    this.ensureFileAudio();
  }

  playFile(name: SeName): boolean {
    if (!this.fileAudio || this.fileOk[name] === false) return false;
    try {
      const pool = this.fileAudio.pools[name];
      if (!pool) return false;
      const el = pool[this.seCursor[name] % pool.length];
      this.seCursor[name]++;
      el.currentTime = 0;
      const p = el.play() as unknown as Promise<void> | undefined;
      if (p && typeof (p as { catch?: unknown }).catch === "function") {
        (p as Promise<void>).catch(() => {
          this.fileOk[name] = false;
        });
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  toggleBGM(): boolean {
    this.init();
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.bgmEnabled;
  }

  startBGM(): void {
    // ファイルBGMを試し、不可なら合成BGMへ
    if (this.fileAudio && this.fileOk.bgm !== false) {
      try {
        this.stopSynthBGM();
        this.fileAudio.bgm.currentTime = 0;
        const p = this.fileAudio.bgm.play() as unknown as Promise<void> | undefined;
        if (p && typeof (p as { catch?: unknown }).catch === "function") {
          (p as Promise<void>)
            .then(() => {
              this.fileOk.bgm = true;
            })
            .catch(() => {
              this.fileOk.bgm = false;
              if (this.bgmEnabled) this.startSynthBGM();
            });
        }
        return;
      } catch (e) {
        /* fall through to synth */
      }
    }
    this.startSynthBGM();
  }

  stopBGM(): void {
    try {
      if (this.fileAudio) {
        this.fileAudio.bgm.pause();
      }
    } catch (e) {
      /* ignore */
    }
    this.stopSynthBGM();
  }

  stopSynthBGM(): void {
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    this.bgmInterval = null;
  }

  startSynthBGM(): void {
    if (!this.ctx) return;
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx) return;
      if (this.fileOk.bgm === true) return; // ファイルBGM再生中は合成を止める
      const freq = getBgmNoteFreq(this.noteIndex);
      this.playTone(freq, "triangle", 0.15, 0.03);
      if (this.noteIndex % 2 === 0) {
        this.playTone(130.81, "sine", 0.2, 0.05);
      }
      this.noteIndex++;
    }, 200);
  }

  playTone(freq: number, type: OscillatorType, duration: number, gainValue = 0.1): void {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      /* ignore */
    }
  }

  sizzle(count = 1): void {
    if (this.playFile("sizzle")) return;
    const baseFreq = sizzleBaseFreq(count);
    this.playTone(baseFreq, "sawtooth", 0.12, 0.12);
    setTimeout(() => this.playTone(baseFreq * 1.25, "sine", 0.18, 0.15), 40);
  }

  trash(): void {
    if (this.playFile("trash")) return;
    this.playTone(180, "square", 0.1, 0.08);
  }

  dolphin(): void {
    if (this.playFile("dolphin")) return;
    if (!this.ctx) return;
    this.playTone(880, "sine", 0.1, 0.15);
    setTimeout(() => this.playTone(1760, "sine", 0.25, 0.2), 60);
    setTimeout(() => this.playTone(2200, "sine", 0.3, 0.2), 120);
  }

  perfectPull(multiplier = 1): void {
    if (this.playFile("pull")) return;
    if (!this.ctx) return;
    const notes = getPerfectPullNotes(multiplier);
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, "triangle", 0.25, 0.25), i * 45);
    });
  }

  miss(): void {
    if (this.playFile("miss")) return;
    if (!this.ctx) return;
    this.playTone(120, "sawtooth", 0.4, 0.3);
  }
}

/** 旧実装の `const sfx = new SoundFX()` と同等の単一インスタンス。 */
export const sfx = new SoundFX();
