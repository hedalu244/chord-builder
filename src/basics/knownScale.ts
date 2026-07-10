// --- ペアレントスケールと既知スケール ---

import { Interval } from "./pitch";
import { Scale } from "./scale";

export type ParentScaleId = "major" | "harmonicMinor" | "melodicMinor" | "harmonicMajor";

type ParentScale = {
    readonly id: ParentScaleId;
    readonly scale: Scale; // 度数ごとの音程配列(7音、ルートからの昇順)
    readonly name: string;
};

// 度数ごとの音程配列(7音、昇順)を、最も差が少ないチャーチモードとの差分で命名する
function describeDegreePattern(tones: readonly Interval[]): string {
    const ionianScale = new Scale(Interval.map([0, 2, 4, 5, 7, 9, 11]));
    const churchModes = [
        { name: "Ionian", tones: ionianScale.tones },
        { name: "Dorian", tones: ionianScale.shift(1).tones },
        { name: "Phrygian", tones: ionianScale.shift(2).tones },
        { name: "Lydian", tones: ionianScale.shift(3).tones },
        { name: "Mixolydian", tones: ionianScale.shift(4).tones },
        { name: "Aeolian", tones: ionianScale.shift(5).tones },
        { name: "Locrian", tones: ionianScale.shift(6).tones },
    ];

    let bestName = churchModes[0].name;
    let minAccidentalCount = Infinity;

    for (const churchMode of churchModes) {
        const accidentals = tones.flatMap((tone, degreeIndex) => {
            const churchTone = churchMode.tones[degreeIndex];
            const degree = degreeIndex + 1;

            if (tone.equals(churchTone)) return [];
            return tone.value > churchTone.value ? [`♯${degree}`] : [`♭${degree}`];
        });

        if (accidentals.length < minAccidentalCount) {
            minAccidentalCount = accidentals.length;
            bestName = `${churchMode.name} ${accidentals.join(" ")}`.trim();
        }
    }

    return bestName;
}

const PARENT_SCALES: readonly ParentScale[] = [
    { id: "major", scale: new Scale(Interval.map([0, 2, 4, 5, 7, 9, 11])), name: "Major" },
    { id: "harmonicMinor", scale: new Scale(Interval.map([0, 2, 3, 5, 7, 8, 11])), name: "Harmonic Minor" },
    { id: "melodicMinor", scale: new Scale(Interval.map([0, 2, 3, 5, 7, 9, 11])), name: "Melodic Minor" },
    { id: "harmonicMajor", scale: new Scale(Interval.map([0, 2, 4, 5, 7, 8, 11])), name: "Harmonic Major" },
];

export type KnownScaleInfo = {
    readonly name: string; // 既知スケールの名前(チャーチモード + ♯/♭の組み合わせ)
    readonly parentRootOffset: Interval; // シフトする前のペアレントスケール自体のルート
    readonly description: string; // Major shift 2 のような説明
    readonly scale: Scale;
};

// 4つのペアレントスケール x 7シフト = 28通りの既知スケールを事前計算
const knownScales: readonly KnownScaleInfo[] = PARENT_SCALES.flatMap(parentScale =>
    Array.from({ length: 7 }, (_, shift) => {
        const scale = parentScale.scale.shift(shift);
        return {
            name: describeDegreePattern(scale.tones),
            parentRootOffset: parentScale.scale.tones[shift],
            description: `${parentScale.name} shift ${shift}`,
            scale: scale,
        };
    })
);

// スケールが既知スケール(4ペアレントスケールのいずれかのシフト)と完全一致する場合、その情報を返す
export function findKnownScale(scale: Scale): KnownScaleInfo | undefined {
    if (scale.tones.length !== 7) return undefined;
    return knownScales.find(info => info.scale.equals(scale));
}

// 現在チェックされている音(checkedTones)を内包する既知スケールを列挙する
export function findCandidateScales(checkedScale: Scale): KnownScaleInfo[] {
    return knownScales.filter(info => checkedScale.isSubsetOf(info.scale));
}