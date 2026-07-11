import { BasicChord, Mode, ChordDegree } from "./basicChord";
import { Degree, Interval, PitchClass } from "./pitch";

export class RelativeNexus {
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

    // former→latterの実際のコードを、このrelativeNexusとして解釈して矛盾しないか
    match(former: BasicChord, latter: BasicChord): boolean {
        return this.formerMode === former.mode &&
            this.latterMode === latter.mode &&
            this.rootMotion.equals(latter.root.delta(former.root));
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

    // former→latterの実際のコードを、このdegreeNexusとして解釈して矛盾しないか
    // (formerRootDegreeはキーが定まって初めて絶対音高と結びつくため、ここではrelativeNexusの整合性のみが判定対象になる)
    match(former: BasicChord, latter: BasicChord): boolean {
        return this.relativeNexus.match(former, latter);
    }

    get formerRootDegree(): Degree { return this._formerRootDegree; }
    get latterRootDegree(): Degree {
        return new Degree(this._formerRootDegree.value + this.relativeNexus.rootMotion.value);
    }

    
    private get formerChordDegree(): ChordDegree {
        return new ChordDegree(this.formerRootDegree, this.relativeNexus.formerMode);
    }
    private get latterChordDegree(): ChordDegree {
        return new ChordDegree(this.latterRootDegree, this.relativeNexus.latterMode);
    }
    /*
    // 接続元のコードから、この接続に従った接続先のコードを求める
    private resolveLatterChord(formerChord: BasicChord): BasicChord {
        const latterRoot = formerChord.root.add(this.relativeNexus.rootMotion);
        return new BasicChord(latterRoot, this.relativeNexus.latterMode);
    }
    // 接続先のコードから、この接続に従った接続元のコードを求める
    private resolveFormerChord(latterChord: BasicChord): BasicChord {
        const formerRoot = latterChord.root.sub(this.relativeNexus.rootMotion);
        return new BasicChord(formerRoot, this.relativeNexus.formerMode);
    }*/

    // 接続元の絶対ルートが、この接続における接続元のdegreeとなるようなキーを求める
    private resolveKeyFromFormer(formerChord: BasicChord): PitchClass {
        return formerChord.root.getKey(this.formerRootDegree);
    }
    // 接続先の絶対ルートが、この接続における接続先のdegreeとなるようなキーを求める
    private resolveKeyFromLatter(latterChord: BasicChord): PitchClass {
        return latterChord.root.getKey(this.latterRootDegree);
    }

    resolveFromKey(key: PitchClass): KeyNexus {
        return new KeyNexus(key, this);
    }
    resolveFromFormerChord(formerChord: BasicChord): KeyNexus {
        const key = this.resolveKeyFromFormer(formerChord);
        return new KeyNexus(key, this);
    }
    resolveFromLatterChord(latterChord: BasicChord): KeyNexus {
        const key = this.resolveKeyFromLatter(latterChord);
        return new KeyNexus(key, this);
    }

    toString(): string {
        return `${this.formerChordDegree.toString()} → ${this.latterChordDegree.toString()}`;
    }
}

export class KeyNexus {
    readonly key: PitchClass
    readonly degreeNexus: DegreeNexus;

    constructor(key: PitchClass, degreeNexus: DegreeNexus) {
        this.key = key;
        this.degreeNexus = degreeNexus;
    }

    get relativeNexus(): RelativeNexus {
        return this.degreeNexus.relativeNexus;
    }

    get formerChord(): BasicChord {
        const formerRoot = this.degreeNexus.formerRootDegree.toPitchClass(this.key);
        return new BasicChord(formerRoot, this.degreeNexus.relativeNexus.formerMode);
    }

    get latterChord(): BasicChord {
        const latterRoot = this.degreeNexus.latterRootDegree.toPitchClass(this.key);
        return new BasicChord(latterRoot, this.degreeNexus.relativeNexus.latterMode);
    }

    // former→latterの実際のコードを、このkeyNexusとして解釈して矛盾しないか
    match(former: BasicChord, latter: BasicChord): boolean {
        return this.formerChord.equals(former) && this.latterChord.equals(latter);
    }
}