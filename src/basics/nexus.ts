import { BasicChord, ChordDegree } from "./basicChord";
import { findChordQuality, Mode } from "./chordQuality";
import { Degree, Interval, PitchClass } from "./pitch";

class RelativeNexus {
    readonly formerMode: Mode;
    readonly latterMode: Mode;
    readonly rootMotion: Interval; // FormerChordのルートからLatterChordのルートまでの相対的な音程

    constructor(former: Mode, latter: Mode, rootMotion: Interval) {
        this.formerMode = former;
        this.latterMode = latter;
        this.rootMotion = rootMotion;
    }
}

class DegreeNexus {
    readonly relativeNexus: RelativeNexus;
    private _formerRootDegree: Degree;

    constructor(former: ChordDegree, latter: ChordDegree) {
        this._formerRootDegree = former.degree;
        const rootMotion = latter.degree.delta(former.degree);
        this.relativeNexus = new RelativeNexus(former.mode, latter.mode, rootMotion);
    }

    get formerRootDegree(): Degree { return this._formerRootDegree; }
    get latterRootDegree(): Degree {
        return new Degree(this._formerRootDegree.value + this.relativeNexus.rootMotion.value);
    }

    get formerChordDegree(): ChordDegree {
        return new ChordDegree(this.formerRootDegree, this.relativeNexus.formerMode);
    }
    get latterChordDegree(): ChordDegree {
        return new ChordDegree(this.latterRootDegree, this.relativeNexus.latterMode);
    }
}

const KnownNexi: readonly DegreeNexus[] = [
    new DegreeNexus(new ChordDegree(new Degree(7), "major"), new ChordDegree(new Degree(0), "major")), // V-I
    new DegreeNexus(new ChordDegree(new Degree(2), "minor"), new ChordDegree(new Degree(5), "major")), // ii-V
];

function findDegreeNexus(former: ChordDegree, latter: ChordDegree): DegreeNexus | undefined {
    return KnownNexi.find(nexus =>
        nexus.formerChordDegree.degree.value === former.degree.value &&
        nexus.formerChordDegree.mode === former.mode &&
        nexus.latterChordDegree.degree.value === latter.degree.value &&
        nexus.latterChordDegree.mode === latter.mode
    );
};

// V-I in key=A みたいな情報
type NexusMatchResult = {
    nexus: DegreeNexus;
    key: PitchClass;
};

export function calcRelativeNexus(former: BasicChord, latter: BasicChord): RelativeNexus {
    const formerQuality = findChordQuality(former.qualityId);
    const latterQuality = findChordQuality(latter.qualityId);
    const rootMotion = latter.root.delta(former.root);
    return new RelativeNexus(formerQuality.mode, latterQuality.mode, rootMotion);
}

export function findMatchingNexus(former: BasicChord, latter: BasicChord): NexusMatchResult[] {
    const matches: NexusMatchResult[] = [];
    for (let keyValue = 0; keyValue < 12; keyValue++) {
        const key = new PitchClass(keyValue);
        const formerDegree = new ChordDegree(former.root.getDegree(key), findChordQuality(former.qualityId).mode);
        const latterDegree = new ChordDegree(latter.root.getDegree(key), findChordQuality(latter.qualityId).mode);

        const nexus = findDegreeNexus(formerDegree, latterDegree);
        if (nexus) {
            matches.push({ nexus, key });
        }
    }
    return matches;
}
