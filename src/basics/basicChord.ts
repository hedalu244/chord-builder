import { Degree, PitchClass } from "./pitch";
import { ChordQualityId, findChordQuality, Mode } from "./chordQuality";

export type BasicChord = {
    readonly root: PitchClass;
    readonly qualityId: ChordQualityId;
};

export function getPitchClasses(chord: BasicChord): PitchClass[] {
    const quality = findChordQuality(chord.qualityId);
    const intervals = quality.intervals;
    return intervals.map(interval => chord.root.add(interval));
}

export class ChordDegree {
    readonly degree: Degree;
    readonly mode: Mode;

    constructor(degree: Degree, mode: Mode) {
        this.degree = degree;
        this.mode = mode;
    }

    toString(): string {
        switch (this.mode) {
            case "major": return `${this.degree.toString()}`;
            case "minor": return `${this.degree.toString()}m`;
        }
    }
}