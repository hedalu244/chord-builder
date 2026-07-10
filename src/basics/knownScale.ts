// --- ペアレントスケールと既知スケール ---

import { Interval, PitchClass } from "./pitch";
import { Scale } from "./scale";

export type ParentScaleId = "major" | "harmonicMinor" | "melodicMinor" | "harmonicMajor";

const PARENT_SCALE_IDS: readonly ParentScaleId[] = ["major", "harmonicMinor", "melodicMinor", "harmonicMajor"];

const PARENT_SCALE_TONES: Record<ParentScaleId, readonly number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    melodicMinor: [0, 2, 3, 5, 7, 9, 11],
    harmonicMajor: [0, 2, 4, 5, 7, 8, 11],
};

const PARENT_SCALE_NAMES: Record<ParentScaleId, string> = {
    major: "Major",
    harmonicMinor: "Harmonic Minor",
    melodicMinor: "Melodic Minor",
    harmonicMajor: "Harmonic Major",
};

const MAJOR_MODE_NAMES = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"];

// ペアレントスケール(度数ごとの半音配列、7音)を shift だけ回転し、新たなルートからの半音配列(昇順)にする
function rotate(tones: readonly number[], shift: number): number[] {
    const length = tones.length;
    const base = tones[shift % length];
    const rotated: number[] = [];
    for (let i = 0; i < length; i++) {
        const value = ((tones[(shift + i) % length] - base) % 12 + 12) % 12;
        rotated.push(value);
    }
    return rotated.sort((a, b) => a - b);
}

// 度数ごとの半音配列(7音、昇順)を、最も差が少ないメジャースケールのモードとの差分で命名する
function describeDegreePattern(tones: readonly number[]): string {
    let bestShift = 0;
    let bestDiffs: string[] = [];
    let bestDiffCount = Infinity;

    for (let shift = 0; shift < 7; shift++) {
        const majorMode = rotate(PARENT_SCALE_TONES.major, shift);
        const diffs: string[] = [];
        for (let degreeIndex = 0; degreeIndex < 7; degreeIndex++) {
            const delta = tones[degreeIndex] - majorMode[degreeIndex];
            if (delta === 0) continue;
            const degree = degreeIndex + 1;
            diffs.push(delta > 0 ? `♯${degree}` : `♭${degree}`);
        }
        if (diffs.length < bestDiffCount) {
            bestDiffCount = diffs.length;
            bestDiffs = diffs;
            bestShift = shift;
        }
    }

    const baseName = MAJOR_MODE_NAMES[bestShift];
    return bestDiffs.length === 0 ? baseName : `${baseName} ${bestDiffs.join(" ")}`;
}

export type KnownScaleInfo = {
    readonly parentScaleId: ParentScaleId;
    readonly parentScaleName: string;
    readonly parentRoot: PitchClass; // シフトする前のペアレントスケール自体のルート
    readonly shift: number; // 0-6
    readonly name: string;
};

// 指定したルートについて、4つのペアレントスケール x 7シフト = 28通りの既知スケールを列挙する
export function getAllKnownScales(root: PitchClass): { readonly info: KnownScaleInfo; readonly scale: Scale; }[] {
    const results: { readonly info: KnownScaleInfo; readonly scale: Scale; }[] = [];
    for (const parentScaleId of PARENT_SCALE_IDS) {
        const parentTones = PARENT_SCALE_TONES[parentScaleId];
        for (let shift = 0; shift < 7; shift++) {
            const degreePattern = rotate(parentTones, shift);
            const scale = new Scale(root, Interval.map(degreePattern));
            // シフトした度数(parentTones[shift])だけルートから遡ると、シフト前のペアレントスケール自体のルートになる
            const parentRoot = root.sub(new Interval(parentTones[shift]));
            const info: KnownScaleInfo = {
                parentScaleId,
                parentScaleName: PARENT_SCALE_NAMES[parentScaleId],
                parentRoot,
                shift,
                name: describeDegreePattern(degreePattern),
            };
            results.push({ info, scale });
        }
    }
    return results;
}

// スケールが既知スケール(4ペアレントスケールのいずれかのシフト)と完全一致する場合、その情報を返す
export function findKnownScale(scale: Scale): KnownScaleInfo | undefined {
    if (scale.tones.length !== 7) return undefined;
    const match = getAllKnownScales(scale.root).find(({ scale: candidate }) => candidate.equals(scale));
    return match?.info;
}

export type ScaleCandidate = {
    readonly info: KnownScaleInfo;
    readonly scale: Scale;
    readonly exact: boolean;
};

// 現在チェックされている音(checkedTones)を内包する既知スケールを列挙する
export function findCandidateScales(root: PitchClass, checkedTones: readonly Interval[]): ScaleCandidate[] {
    const checkedValues = checkedTones.map(tone => tone.value);
    return getAllKnownScales(root)
        .filter(({ scale }) => checkedValues.every(value => scale.tones.some(tone => tone.value === value)))
        .map(({ info, scale }) => ({
            info,
            scale,
            exact: scale.tones.length === checkedValues.length,
        }));
}