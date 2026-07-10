import { Interval } from "./pitch";

export type Mode = "major" | "minor";

export type ChordQuality = {
    readonly id: string, // 一意なID
    readonly notation: string,
    readonly mode: Mode,
    readonly intervals: readonly Interval[], // もとのルートからの相対的な音程の配列
};

export type ChordQualityId = "major7" | "minor7" | "dominant7";
export const chordQualities: readonly ChordQuality[] = [
    { id: "major7", notation: "M7", mode: "major", intervals: Interval.map([0, 4, 7, 11]) },
    { id: "dominant7", notation: "7", mode: "major", intervals: Interval.map([0, 4, 7, 10]) },

    { id: "minor7", notation: "m7", mode: "minor", intervals: Interval.map([0, 3, 7, 10]) },
];

export function findChordQuality(id: ChordQualityId): ChordQuality {
    const quality = chordQualities.find(q => q.id === id);
    if (!quality) {
        throw new Error(`Unknown chord quality: ${id}`);
    }
    return quality;
}

export function findQualitiesByMode(mode: Mode): readonly ChordQuality[] {
    return chordQualities.filter(quality => quality.mode === mode);
}

