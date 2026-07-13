import { Interval, PitchClass } from "./pitch";
import { Scale } from "./scale";
import { ScaleInfo } from "./scaleInfo";

// --- スケール辞書 ---
// 既知スケールを「ペアレントスケール × シフト」のID(ScaleInfo)で一元管理する。
// contextScale(shift=0で運用)とchordScale(rootを固定して候補を列挙)の両方がここを参照する。
//
// 命名規則(自明ではないため注意):
//   key  = ペアレントスケールの主音。contextScaleの文脈では主音をkeyと呼ぶのが一般的なため。
//   root = shift後のスケールの主音。chordScaleの文脈では主音をrootと呼ぶのが一般的なため。
// contextScaleはshift=0で運用されるため key === root となり、両文脈の呼び分けは矛盾しない。

const CHURCH_MODE_NAMES = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"];
// 度数ごとの音程配列(7音、昇順)を、最も差が少ないチャーチモードとの差分で命名する
function describeDegreePattern(tones: readonly Interval[]): string {
    const ionianScale = new Scale(Interval.map([0, 2, 4, 5, 7, 9, 11]));
    const churchModes = CHURCH_MODE_NAMES.map((name, shift) => ({ name, tones: ionianScale.shift(shift).tones }));

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

// 生成もkey基準(コンストラクタ)とroot基準(fromRoot)の両方から行える。
export const PARENT_SCALE_IDS = ["Major", "Harmonic Minor", "Melodic Minor", "Harmonic Major", "Diminished", "Augmented", "Whole Tone"] as const;
export type ParentScaleID = typeof PARENT_SCALE_IDS[number];

// contextScaleとして選択可能なスケール(ペアレントスケールのうち調として運用する4つ)
export const contextScaleNames: readonly ParentScaleID[] = ["Major", "Harmonic Minor", "Melodic Minor", "Harmonic Major"];

export type ParentScaleEntry = {
    readonly id: ParentScaleID;
    readonly scale: Scale; // keyからの音程集合
    // shiftごとのモード名。長さが相異なるモードの数を兼ねる(対称スケールはシフトで自身に戻るため構成音数より少ない)
    readonly shiftedNames: readonly string[];
};

// 7音スケールは全シフトが相異なるモードになり、名前はチャーチモードとの差分で導出できる
function sevenToneEntry(id: ParentScaleID, values: number[]): ParentScaleEntry {
    const scale = new Scale(Interval.map(values));
    const shiftedNames = scale.tones.map((_, shift) => describeDegreePattern(scale.shift(shift).tones));
    return { id, scale, shiftedNames };
}

const PARENT_SCALES: readonly ParentScaleEntry[] = [
    sevenToneEntry("Major", [0, 2, 4, 5, 7, 9, 11]),
    sevenToneEntry("Harmonic Minor", [0, 2, 3, 5, 7, 8, 11]),
    sevenToneEntry("Melodic Minor", [0, 2, 3, 5, 7, 9, 11]),
    sevenToneEntry("Harmonic Major", [0, 2, 4, 5, 7, 8, 11]),
    // 対称スケール: shift 2(Whole Toneはshift 1)で自分自身に戻るため、相異なるモードのみを列挙する
    { id: "Diminished", scale: new Scale(Interval.map([0, 2, 3, 5, 6, 8, 9, 11])), shiftedNames: ["Diminished", "Inv Diminished"] },
    { id: "Augmented", scale: new Scale(Interval.map([0, 3, 4, 7, 8, 11])), shiftedNames: ["Augmented", "Inv Augmented"] },
    { id: "Whole Tone", scale: new Scale(Interval.map([0, 2, 4, 6, 8, 10])), shiftedNames: ["Whole Tone"] },
];

// 全ペアレント × 全シフトの相対スケール(rootからの音程集合)。逆引き用の事前計算
const KNOWN_SCALES: readonly { parentScale: ParentScaleID; shift: number; scale: Scale }[] =
    PARENT_SCALES.flatMap(entry =>
        entry.shiftedNames.map((_, shift) => ({ parentScale: entry.id, shift, scale: entry.scale.shift(shift) }))
    );

// ペアレントスケールIDからParentScaleEntryを取得
export function resolveParentScale(id: ParentScaleID): ParentScaleEntry {
    const entry = PARENT_SCALES.find(entry => entry.id === id);
    if (!entry) throw new Error(`unknown parent scale: ${id}`);
    return entry;
}

// 逆引き: rootを固定し、scaleと完全一致する既知スケールを探す
export function findScaleInfo(root: PitchClass, scale: Scale): ScaleInfo | undefined {
    const found = KNOWN_SCALES.find(known => known.scale.equals(scale));
    return found && ScaleInfo.fromRoot(root, found.parentScale, found.shift);
}

// 逆引き: rootを固定し、checkedScaleを内包する既知スケールを列挙する
export function findSuperScaleInfos(root: PitchClass, checkedScale: Scale): ScaleInfo[] {
    return KNOWN_SCALES
        .filter(known => checkedScale.isSubsetOf(known.scale))
        .map(known => ScaleInfo.fromRoot(root, known.parentScale, known.shift));
}
