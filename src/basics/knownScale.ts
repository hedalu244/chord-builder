// --- ペアレントスケールと既知スケール ---

import { Interval, PitchClass } from "./pitch";
import { Scale } from "./scale";

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

type ParentScale = {
    readonly scale: Scale; // 度数ごとの音程配列(7音、ルートからの昇順)
    readonly name: string;
};

const PARENT_SCALES: readonly ParentScale[] = [
    { scale: new Scale(Interval.map([0, 2, 4, 5, 7, 9, 11])), name: "Major" },
    { scale: new Scale(Interval.map([0, 2, 3, 5, 7, 8, 11])), name: "Harmonic Minor" },
    { scale: new Scale(Interval.map([0, 2, 3, 5, 7, 9, 11])), name: "Melodic Minor" },
    { scale: new Scale(Interval.map([0, 2, 4, 5, 7, 8, 11])), name: "Harmonic Major" },
];

type KnownScaleInfo = {
    readonly type: "shifted";
    readonly name: string; // 既知スケールの名前(チャーチモード + ♯/♭の組み合わせ)
    readonly parentRootOffset: Interval; // ペアレントスケールのルートからのオフセット
    readonly description: string; // Major shift 2 のような説明
} | {
    readonly type: "other";
    readonly name: string; // 既知スケールの名前(チャーチモード + ♯/♭の組み合わせ)
    readonly description: string;
};

export type KnownScale = {
    readonly scale: Scale;
    readonly info: KnownScaleInfo;
};

// 4つのペアレントスケール x 7シフト = 28通りと5通りの特殊スケールを事前計算
const knownScales: readonly KnownScale[] = [
    ...PARENT_SCALES.flatMap(parentScale =>
        Array.from({ length: 7 }, (_, shift) => {
            const scale = parentScale.scale.shift(shift);
            return {
                scale,
                info: {
                    type: "shifted" as const,
                    name: describeDegreePattern(scale.tones),
                    parentRootOffset: parentScale.scale.tones[shift],
                    description: `${parentScale.name} shift ${shift}`,
                }
            };
        })),
    { scale: new Scale(Interval.map([0, 2, 3, 5, 6, 8, 9, 11])), info: { type: "other" as const, name: "Diminished", description: "" } },
    { scale: new Scale(Interval.map([0, 1, 3, 4, 6, 7, 9, 10])), info: { type: "other" as const, name: "Inv Diminished", description: "" } },
    { scale: new Scale(Interval.map([0, 1, 4, 5, 8, 9])), info: { type: "other" as const, name: "Inv Augmented", description: "" } },
    { scale: new Scale(Interval.map([0, 2, 4, 6, 8, 10])), info: { type: "other" as const, name: "Whole Tone", description: "" } },
    { scale: new Scale(Interval.map([0, 3, 4, 7, 8, 11])), info: { type: "other" as const, name: "Augmented", description: "" } },
];

export function findKnownScale(scale: Scale): KnownScale | undefined {
    return knownScales.find(known => known.scale.equals(scale));
}

// checkedScaleを内包する既知スケールを列挙する
export function findCandidateScales(checkedScale: Scale): KnownScale[] {
    return knownScales.filter(known => checkedScale.isSubsetOf(known.scale));
}

// スケールが既知スケール(4ペアレントスケールのいずれかのシフト)と完全一致する場合、その情報を返す
export function getKnownScaleInfo(known: KnownScale | undefined, root: PitchClass): { name: string, description: string; } {
    if (!known)
        return {
            name: "Unknown Scale",
            description: ""
        };

    if (known.info.type === "shifted")
        return {
            name: `${root.toString()} ${known.info.name}`,
            description: `${root.sub(known.info.parentRootOffset).toString()} ${known.info.description}`
        };

    return {
        name: `${root.toString()} ${known.info.name}`,
        description: known.info.description
    };
}