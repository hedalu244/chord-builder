import { findChordQuality } from "./chordQuality";
import { FullChordInfo } from "./fullChordInfo";
import { Interval, PitchClass } from "./pitch";

// スケール = ルート + ルートから見た構成音(半音値の集合)
export class Scale {
    readonly root: PitchClass;
    readonly tones: readonly Interval[]; // 昇順、重複なし。必ずInterval(0)を含む

    constructor(root: PitchClass, tones: readonly Interval[]) {
        this.root = root;
        const uniqueValues = Array.from(new Set(tones.map(tone => tone.value))).sort((a, b) => a - b);
        this.tones = uniqueValues.map(value => new Interval(value));
    }

    equals(other: Scale): boolean {
        if (!this.root.equals(other.root)) return false;
        if (this.tones.length !== other.tones.length) return false;
        return this.tones.every((tone, i) => tone.equals(other.tones[i]));
    }

    has(tone: Interval): boolean {
        return this.tones.some(t => t.equals(tone));
    }

    getPitchClasses(): PitchClass[] {
        return this.tones.map(tone => this.root.add(tone));
    }
}

// --- コード構成音 ---

export function getChordRoot(chordInfo: FullChordInfo): PitchClass {
    if (chordInfo.qualityId === undefined) {
        return chordInfo.chord.root;
    }
    return findChordQuality(chordInfo.qualityId).getRoot(chordInfo.chord);
}

export function getChordToneIntervals(chordInfo: FullChordInfo): Interval[] {
    const root = getChordRoot(chordInfo);
    const pitchClasses = chordInfo.qualityId === undefined
        ? chordInfo.chord.getChordTones()
        : findChordQuality(chordInfo.qualityId).getChordTones(chordInfo.chord.root);
    return pitchClasses.map(pitchClass => pitchClass.delta(root));
}

export function getScale(chordInfo: FullChordInfo): Scale {
    const root = getChordRoot(chordInfo);
    const chordTones = getChordToneIntervals(chordInfo);
    const extraTones = chordInfo.extraScaleTones ?? [];
    return new Scale(root, [...chordTones, ...extraTones]);
}

export function isDefaultScale(chordInfo: FullChordInfo): boolean {
    return (chordInfo.extraScaleTones ?? []).length === 0;
}