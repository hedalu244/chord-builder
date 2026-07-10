import { Degree, PitchClass } from "./pitch";
import { ChordQualityId, findChordQuality, Mode } from "./chordQuality";

export class BasicChord {
    readonly root: PitchClass;
    readonly qualityId: ChordQualityId;

    constructor(root: PitchClass, qualityId: ChordQualityId) {
        this.root = root;
        this.qualityId = qualityId;
    }
    equals(other: BasicChord): boolean {
        return this.root.equals(other.root) && this.qualityId === other.qualityId;
    }

    getPitchClasses(): PitchClass[] {
        const quality = findChordQuality(this.qualityId);
        const intervals = quality.intervals;
        return intervals.map(interval => this.root.add(interval));
    }

    toString(): string {
        const quality = findChordQuality(this.qualityId);
        return `${this.root.toString()}${quality.notation}`;
    }
}

export class ChordDegree {
    readonly degree: Degree;
    readonly mode: Mode;

    constructor(degree: Degree, mode: Mode) {
        this.degree = degree;
        this.mode = mode;
    }
    equals(other: ChordDegree): boolean {
        return this.degree.equals(other.degree) && this.mode === other.mode;
    }

    toString(): string {
        switch (this.mode) {
            case "major": return `${this.degree.toString()}`;
            case "minor": return `${this.degree.toString()}m`;
        }
    }
}