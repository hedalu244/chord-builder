import { Triad } from "./triad";
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

// former/latterの構成音(合計6音、重複はそのまま数える)のうち、スケールに含まれる音の数が最も多くなる
// キー・スケールを推定する。同点の場合はキーの昇順→knownScalesの定義順で最初に見つかったものを採用する
// former/latterのどちらかが定まっていない場合は推定できないためundefinedを返す
export function estimateContextScale(former: Triad | undefined, latter: Triad | undefined): ContextScale | undefined {
    if (former === undefined || latter === undefined) return undefined;

    const chordTones = [...former.getChordTones(), ...latter.getChordTones()];

    let best = new ContextScale(PitchClass.all[0], knownScales[0].name);
    let bestScore = -1;
    for (const key of PitchClass.all) {
        for (const { scale, name } of knownScales) {
            const pitchClasses = scale.getPitchClasses(key);
            const score = chordTones.filter(tone => pitchClasses.some(pc => pc.equals(tone))).length;
            if (score > bestScore) {
                bestScore = score;
                best = new ContextScale(key, name);
            }
        }
    }
    return best;
}