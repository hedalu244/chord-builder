import { Triad, Mode, DegreeTriad } from "./triad";
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
    match(former: Triad, latter: Triad): boolean {
        return this.formerMode === former.mode &&
            this.latterMode === latter.mode &&
            this.rootMotion.equals(latter.root.delta(former.root));
    }

    toString(): string {
        return `${this.formerMode} → ${this.rootMotion.toStringRelative()} ${this.latterMode}`;
    }
}

// former→latterの実際のコードから、キーに依存しない相対関係(モードとルート間の音程)を求める
export function calcRelativeNexus(former: Triad, latter: Triad): RelativeNexus {
    return new RelativeNexus(former.mode, latter.mode, latter.root.delta(former.root));
}

// contextScaleのキーを基準に、単一のTriadを度数表記に変換する
export function calcTriadDegree(chord: Triad, contextScale: ContextScale): DegreeTriad {
    return new DegreeTriad(chord.root.getDegree(contextScale.key), chord.mode);
}

// contextScaleのキーを基準に、former→latterのDegreeNexusを求める
export function calcDegreeNexus(former: Triad, latter: Triad, contextScale: ContextScale): DegreeNexus {
    return new DegreeNexus(
        calcTriadDegree(former, contextScale),
        calcTriadDegree(latter, contextScale)
    );
}

export class DegreeNexus {
    readonly relativeNexus: RelativeNexus;
    private _formerRootDegree: Degree;

    constructor(former: DegreeTriad, latter: DegreeTriad) {
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
    match(former: Triad, latter: Triad): boolean {
        return this.relativeNexus.match(former, latter);
    }

    get formerRootDegree(): Degree { return this._formerRootDegree; }
    get latterRootDegree(): Degree {
        return new Degree(this._formerRootDegree.value + this.relativeNexus.rootMotion.value);
    }
    
    private get formerChordDegree(): DegreeTriad {
        return new DegreeTriad(this.formerRootDegree, this.relativeNexus.formerMode);
    }
    private get latterChordDegree(): DegreeTriad {
        return new DegreeTriad(this.latterRootDegree, this.relativeNexus.latterMode);
    }

    toString(): string {
        return `${this.formerChordDegree.toString()} → ${this.latterChordDegree.toString()}`;
    }
}