// 音の数値計算（元: public/app.js SoundFX sizzle / perfectPull / startSynthBGM）
// AudioContext / setTimeout などの副作用は含まない。
export const SIZZLE_BASE_FREQ = 500;
export const SIZZLE_FREQ_STEP = 120;
export const PERFECT_PULL_FREQS = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
export const BGM_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
export const BGM_MELODY = [0, 2, 3, 5, 4, 3, 2, 0, 3, 5, 7, 5, 4, 3, 2, 0];
/** ジュー音の基準周波数。旧実装: 500 + (count-1)*120 */
export function sizzleBaseFreq(count) {
    return SIZZLE_BASE_FREQ + (count - 1) * SIZZLE_FREQ_STEP;
}
/** 引き上げ音の音列。旧実装: freqs.slice(0, 2+multiplier) */
export function getPerfectPullNotes(multiplier) {
    return PERFECT_PULL_FREQS.slice(0, 2 + multiplier);
}
/** 合成BGMの n 番目の音。旧実装: scale[melody[noteIndex % 16]] */
export function getBgmNoteFreq(noteIndex) {
    const degree = BGM_MELODY[noteIndex % BGM_MELODY.length];
    return BGM_SCALE[degree];
}
