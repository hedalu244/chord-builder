import { Interval, PitchClass } from "./pitch";
import { BasicChord, BasicChordQuality } from "./basicChord";

export type ChordVariant = {
    readonly name: string,
    readonly baseQuality: BasicChordQuality,
    readonly intervals: readonly Interval[], // もとのルートからの相対的な音程の配列
}

export const chordVariants: readonly ChordVariant[] = [
    { name: "major7", baseQuality: "major", intervals: Interval.map([0, 4, 7, 11]) },
    { name: "minor7", baseQuality: "minor", intervals: Interval.map([0, 3, 7, 10]) },
    { name: "dominant7", baseQuality: "major", intervals: Interval.map([0, 4, 7, 10]) }
];


export function getVariantPitchClasses(chord: BasicChord, variant: ChordVariant): PitchClass[] {
    if (chord.quality !== variant.baseQuality) {
        throw new Error(`Chord quality mismatch: chord quality is ${chord.quality}, but variant base is ${variant.baseQuality}`);
    }

    const intervals = variant.intervals;
    return intervals.map(interval => chord.root.add(interval));
}