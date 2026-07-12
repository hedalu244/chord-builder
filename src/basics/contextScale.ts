import { Interval, PitchClass } from "./pitch";
import { Scale } from "./scale";

type KnownScale = {
    readonly scale: Scale;
    readonly name: string;
};

const knownScales: readonly KnownScale[] = [
    { scale: new Scale(Interval.map([0, 2, 4, 5, 7, 9, 11])), name: "Major" },
    { scale: new Scale(Interval.map([0, 2, 3, 5, 7, 8, 11])), name: "Harmonic Minor" },
    { scale: new Scale(Interval.map([0, 2, 3, 5, 7, 9, 11])), name: "Melodic Minor" },
    { scale: new Scale(Interval.map([0, 2, 4, 5, 7, 8, 11])), name: "Harmonic Major" },
];

export const knownScaleNames: readonly string[] = knownScales.map(({ name }) => name);

// 前後のコードとの関係を表すキー・スケール。実体のScaleは持たず、knownScaleNamesのいずれかをnameとして持つ(idのように扱う)
// ChordScaleとは全くの別概念なので注意すること。変数名の都合などで一語に略すときはccaleではなくcontextと略すこと
export class ContextScale {
    readonly key: PitchClass;
    readonly name: string;

    constructor(key: PitchClass, name: string) {
        this.key = key;
        this.name = name;
    }

    getScale(): Scale {
        const found = knownScales.find(known => known.name === this.name);
        if (!found) {
            throw new Error(`unknown scale name: ${this.name}`);
        }
        return found.scale;
    }

    equals(other: ContextScale): boolean {
        return this.key.equals(other.key) && this.name === other.name;
    }

    // 片方または両方がundefinedの場合も扱えるequals。配列の差分検出(Progression.sync)で使う
    static equals(a: ContextScale | undefined, b: ContextScale | undefined): boolean {
        if (a === undefined || b === undefined) return a === b;
        return a.equals(b);
    }
}
