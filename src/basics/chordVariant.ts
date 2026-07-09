import { Interval, PitchClass } from "./pitch";
import { BasicChord, BasicChordQuality } from "./basicChord";

export type ChordVariant = {
    readonly name: string,
    //readonly baseQuality: BasicChordQuality,
    readonly intervals: readonly Interval[], // もとのルートからの相対的な音程の配列
};

export const chordVariants: { [key in BasicChordQuality]: readonly ChordVariant[] } = {
    major: [
        { name: "major7", intervals: Interval.map([0, 4, 7, 11]) },
        { name: "dominant7", intervals: Interval.map([0, 4, 7, 10]) },
    ],
    minor: [
        { name: "minor7", intervals: Interval.map([0, 3, 7, 10]) },
    ]
};

export function isSameVariant(left: ChordVariant, right: ChordVariant): boolean {
    if (left.name !== right.name) {
        return false;
    }
    if (left.intervals.length !== right.intervals.length) {
        return false;
    }

    for (const [index, interval] of left.intervals.entries()) {
        if (interval.value !== right.intervals[index].value) {
            return false;
        }
    }

    return true;
}

export function checkCompatibility(
    currentVariant: ChordVariant,
    quality: BasicChordQuality
): ChordVariant {
    const compatibleVariants = chordVariants[quality];
    const isCompatible = compatibleVariants.some(variant => isSameVariant(variant, currentVariant));
    if (isCompatible) {
        return currentVariant;
    }

    const fallbackVariant = compatibleVariants[0];
    if (fallbackVariant === undefined) {
        throw new Error(`no fallback variant for quality: ${quality}`);
    }
    return fallbackVariant;
}


export function getVariantPitchClasses(chord: BasicChord, variant: ChordVariant): PitchClass[] {
    const intervals = variant.intervals;
    return intervals.map(interval => chord.root.add(interval));
}