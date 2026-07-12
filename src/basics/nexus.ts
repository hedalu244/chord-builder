import { BasicChord, Mode, ChordDegree } from "./basicChord";
import { ContextScale } from "./contextScale";
import { Degree, Interval } from "./pitch";

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

// contextScaleのキーを基準に、former→latterのDegreeNexusを求める
export function calcDegreeNexus(former: BasicChord, latter: BasicChord, contextScale: ContextScale): DegreeNexus {
    return new DegreeNexus(
        new ChordDegree(former.root.getDegree(contextScale.key), former.mode),
        new ChordDegree(latter.root.getDegree(contextScale.key), latter.mode)
    );
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

    toString(): string {
        return `${this.formerChordDegree.toString()} → ${this.latterChordDegree.toString()}`;
    }
}