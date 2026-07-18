import { Chord } from "./chord";
import { PitchClass } from "./pitch";

// ボイシング = 実際に鳴らすノート番号(MIDI)の昇順配列。
// 同じピッチクラスを複数のオクターブで鳴らすことも許容する
export type Voicing = readonly number[];

// 自動生成の音域を定める正規分布のパラメータ(MIDIノート番号)。
const MEAN_NOTE = 64;
const STDDEV = 6;
// 候補ノートの探索範囲。この外側は正規分布のウェイトが無視できるほど小さい
const MIN_NOTE = 24;
const MAX_NOTE = 96;

function normalWeight(note: number): number {
    const deviation = (note - MEAN_NOTE) / STDDEV;
    return Math.exp(-deviation * deviation / 2);
}

// ウェイト配列に比例した確率でインデックスを1つ選ぶ
function sampleIndex(weights: readonly number[]): number {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let remaining = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        remaining -= weights[i];
        if (remaining <= 0) return i;
    }
    return weights.length - 1;
}

// 各構成音を1つずつ、どのオクターブで鳴らすかを正規分布N(12x+p)のウェイトで
// ランダムに決定してボイシングを生成する
export function generateVoicing(chord: Chord): Voicing {
    const notes = chord.chordTones.map(tone => {
        const candidates: number[] = [];
        for (let note = MIN_NOTE + tone.value; note <= MAX_NOTE; note += 12) {
            candidates.push(note);
        }
        return candidates[sampleIndex(candidates.map(normalWeight))];
    });
    return notes.sort((a, b) => a - b);
}

export function voicingEquals(a: Voicing, b: Voicing): boolean {
    return a.length === b.length && a.every((note, i) => note === b[i]);
}

// デバッグ表示用: MIDIノート番号を"C4"のような音名にする
export function noteName(note: number): string {
    return `${new PitchClass(note)}${Math.floor(note / 12) - 1}`;
}
