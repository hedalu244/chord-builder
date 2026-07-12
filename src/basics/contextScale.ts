import { BasicChord } from "./basicChord";
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

export type ContextScale = {
    readonly key: PitchClass;
    readonly name: string;
};

export const knownScaleNames: readonly string[] = knownScales.map(({ name }) => name);

// former/latterの構成音(合計6音、重複はそのまま数える)のうち、スケールに含まれる音の数が最も多くなる
// キー・スケールを推定する。同点の場合はキーの昇順→knownScalesの定義順で最初に見つかったものを採用する
export function estimateContextScale(former: BasicChord, latter: BasicChord): ContextScale {
    const chordTones = [...former.getChordTones(), ...latter.getChordTones()];

    let best: ContextScale = { key: PitchClass.all[0], name: knownScales[0].name };
    let bestScore = -1;
    for (const key of PitchClass.all) {
        for (const { scale, name } of knownScales) {
            const pitchClasses = scale.getPitchClasses(key);
            const score = chordTones.filter(tone => pitchClasses.some(pc => pc.equals(tone))).length;
            if (score > bestScore) {
                bestScore = score;
                best = { key, name };
            }
        }
    }
    return best;
}