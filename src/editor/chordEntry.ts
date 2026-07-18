import { Chord } from "../basics/chord";
import { Interval } from "../basics/pitch";
import { Scale } from "../basics/scale";
import { Voicing, voicingEquals } from "../basics/voicing";

// Progressionの外部表現(1コード分)。編集セッション中のみ意味を持つid/contextScaleは含まない
export class ChordEntry {
    readonly chord: Chord;
    // undefined(または空配列) = デフォルトスケール(コード構成音のみ)。それ以外はコード構成音に追加する音(スケールルートからの半音値)
    readonly extraChordScaleTones: readonly Interval[] | undefined;
    // コードが変更されたときは自動生成された値で初期化され、以降は手動調整も保持される
    readonly voicing: Voicing;

    constructor(chord: Chord, extraChordScaleTones: readonly Interval[] | undefined, voicing: Voicing) {
        this.chord = chord;
        this.extraChordScaleTones = extraChordScaleTones;
        this.voicing = voicing;
    }

    equals(other: ChordEntry): boolean {
        if (!this.chord.equals(other.chord)) return false;
        if (!voicingEquals(this.voicing, other.voicing)) return false;
        const tones = this.extraChordScaleTones ?? [];
        const otherTones = other.extraChordScaleTones ?? [];
        if (tones.length !== otherTones.length) return false;
        return tones.every((tone, i) => tone.equals(otherTones[i]));
    }

    // 片方または両方がundefinedの場合も扱えるequals。配列の差分検出(Progression.sync)で使う
    static equals(a: ChordEntry | undefined, b: ChordEntry | undefined): boolean {
        if (a === undefined || b === undefined) return a === b;
        return a.equals(b);
    }

    // コードの構成音に、extraChordScaleTones(スケールルートから見た追加音)を足し合わせて「コードスケール」を作る。
    // 前後のコード進行から決まるcontextScaleとは全く別の概念であることに注意。
    getChordScale(): Scale {
        const chordTones = this.chord.getChordToneIntervals();
        const extraTones = this.extraChordScaleTones ?? [];
        return new Scale([...chordTones, ...extraTones]);
    }
}
