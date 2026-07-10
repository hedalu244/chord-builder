import { BasicChord, Mode, ChordDegree } from "./basicChord";
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

    equals(other: RelativeNexus): boolean {
        return this.formerMode === other.formerMode &&
            this.latterMode === other.latterMode &&
            this.rootMotion.equals(other.rootMotion);
    }

    toString(): string {
        return `${this.formerMode} → ${this.rootMotion.toStringRelative()} ${this.latterMode}`;
    }
}

export function calcRelativeNexus(former: BasicChord, latter: BasicChord): RelativeNexus {
    const rootMotion = latter.root.delta(former.root);
    return new RelativeNexus(former.mode, latter.mode, rootMotion);
}

export class DegreeNexus {
    readonly relativeNexus: RelativeNexus;
    private _formerRootDegree: Degree;

    constructor(former: ChordDegree, latter: ChordDegree) {
        this._formerRootDegree = former.degree;
        const rootMotion = latter.degree.delta(former.degree);
        this.relativeNexus = new RelativeNexus(former.mode, latter.mode, rootMotion);
    }
    equals(other: DegreeNexus): boolean {
        return this.formerRootDegree.equals(other.formerRootDegree) &&
            this.relativeNexus.equals(other.relativeNexus);
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

    // 接続元の絶対ルートから、この接続に従った接続先の絶対ルートを求める
    resolveLatterRoot(formerRoot: PitchClass): PitchClass {
        return formerRoot.add(this.relativeNexus.rootMotion);
    }
    // 接続先の絶対ルートから、この接続に従った接続元の絶対ルートを求める
    resolveFormerRoot(latterRoot: PitchClass): PitchClass {
        return latterRoot.sub(this.relativeNexus.rootMotion);
    }

    // 接続元のコードから、この接続に従った接続先のコードを求める
    resolveLatterChord(formerChord: BasicChord): BasicChord {
        return new BasicChord(this.resolveLatterRoot(formerChord.root), this.relativeNexus.latterMode);
    }
    // 接続先のコードから、この接続に従った接続元のコードを求める
    resolveFormerChord(latterChord: BasicChord): BasicChord {
        return new BasicChord(this.resolveFormerRoot(latterChord.root), this.relativeNexus.formerMode);
    }

    // 接続元の絶対ルートが、この接続における接続元のdegreeとなるようなキーを求める
    resolveKeyFromFormerRoot(formerRoot: PitchClass): PitchClass {
        return formerRoot.getKey(this.formerRootDegree);
    }
    // 接続先の絶対ルートが、この接続における接続先のdegreeとなるようなキーを求める
    resolveKeyFromLatterRoot(latterRoot: PitchClass): PitchClass {
        return latterRoot.getKey(this.latterRootDegree);
    }

    toString(): string {
        return `${this.formerChordDegree.toString()} → ${this.latterChordDegree.toString()}`;
    }
}

// とりあえずI, IIm, IIIm, IV, V, VIm, の6つの組み合わせを入れてみる
export const KnownNexi: readonly DegreeNexus[] = [
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("V")),
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("III")),
    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("V")),
    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("V")),
    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("V")),
    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("V")),
];

export function findNexiByFormerMode(mode: Mode): readonly DegreeNexus[] {
    return KnownNexi.filter(nexus => nexus.relativeNexus.formerMode === mode);
}
export function findNexiByLatterMode(mode: Mode): readonly DegreeNexus[] {
    return KnownNexi.filter(nexus => nexus.relativeNexus.latterMode === mode);
}

// V-I in key=A みたいな情報
type NexusMatchResult = {
    nexus: DegreeNexus;
    key: PitchClass;
};
export function findMatchingNexus(former: BasicChord, latter: BasicChord): NexusMatchResult[] {
    const matches: NexusMatchResult[] = [];
    for (let keyValue = 0; keyValue < 12; keyValue++) {
        const key = new PitchClass(keyValue);
        const formerDegree = new ChordDegree(former.root.getDegree(key), former.mode);
        const latterDegree = new ChordDegree(latter.root.getDegree(key), latter.mode);

        const targetNexus = new DegreeNexus(formerDegree, latterDegree);
        const nexus = KnownNexi.filter(nexus => nexus.equals(targetNexus));

        matches.push(...nexus.map(nexus => ({ nexus, key })));
    }
    return matches;
}
