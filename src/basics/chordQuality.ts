import { Interval, PitchClass } from "./pitch";
import { Triad, Mode } from "./triad";

export class ChordQuality {
    readonly id: string; // 一意なID
    private readonly notation: string;
    readonly mode: Mode;
    readonly intervals: readonly Interval[]; // もとのルートからの相対的な音程の配列
    constructor(id: string, notation: string, mode: Mode, intervals: readonly Interval[]) {
        this.id = id;
        this.notation = notation;
        this.mode = mode;
        this.intervals = intervals;
    }

    getChordTones(root: PitchClass): PitchClass[] {
        return this.intervals.map(interval => root.add(interval));
    }

    getRoot(triad: Triad): PitchClass {
        return triad.root.add(this.intervals[0]);
    }

    getNotation(triad: Triad): string {
        return triad.root.add(this.intervals[0]).toString() + this.notation;
    }
}

export type ChordQualityId = "major7" | "minor7" | "dominant7" | "b9omit1" | "9omit1" | "major6";
export const chordQualities: readonly ChordQuality[] = [
    new ChordQuality("minor7", "m7", "m", Interval.map([0, 3, 7, 10])),

    new ChordQuality("major7", "M7", "M", Interval.map([0, 4, 7, 11])),
    new ChordQuality("major6", "6", "M", Interval.map([0, 4, 7, 9])),
    new ChordQuality("dominant7", "7", "M", Interval.map([0, 4, 7, 10])),
    new ChordQuality("b9omit1", "dim7", "M", Interval.map([4, 7, 10, 1])),
    new ChordQuality("9omit1", "m7-5", "M", Interval.map([4, 7, 10, 2])),
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

