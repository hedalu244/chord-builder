import { Chord } from "./chord";
import { Interval, PitchClass } from "./pitch";
import { allTriads, Mode, Triad } from "./triad";

// 既知のコードクオリティ。
// intervalsは土台トライアドのルートからの相対音程で、先頭が実際のルート
export type KnownQualityId = "M" | "m" | "6" | "7" | "M7" | "m7" | "m7-5" | "dim7";

export type KnownQuality = {
    readonly id: KnownQualityId;
    readonly notation: string;
    readonly intervals: readonly Interval[];
    readonly triadMode: Mode;
};

export const knownQualities: readonly KnownQuality[] = [
    { id: "M", notation: "", intervals: Interval.map([0, 4, 7]), triadMode: "M" },
    { id: "m", notation: "m", intervals: Interval.map([0, 3, 7]), triadMode: "m" },
    { id: "6", notation: "6", intervals: Interval.map([0, 4, 7, 9]), triadMode: "M" },
    { id: "7", notation: "7", intervals: Interval.map([0, 4, 7, 10]), triadMode: "M" },
    { id: "M7", notation: "M7", intervals: Interval.map([0, 4, 7, 11]), triadMode: "M" },
    { id: "m7", notation: "m7", intervals: Interval.map([0, 3, 7, 10]), triadMode: "m" },
    { id: "m7-5", notation: "m7-5", intervals: Interval.map([9, 0, 3, 7]), triadMode: "m" },
    { id: "dim7", notation: "dim7", intervals: Interval.map([1, 4, 7, 10]), triadMode: "M" },
];

const knownQualityById = new Map(knownQualities.map(quality => [quality.id, quality]));

// idから既知クオリティを引く
export function qualityById(id: KnownQualityId): KnownQuality {
    const quality = knownQualityById.get(id);
    if (quality === undefined) throw new Error(`Unknown quality id: ${id}`);
    return quality;
}

// 与えられたルートに対するコード
export function qualityToChord(root: PitchClass, quality: KnownQuality): Chord {
    return new Chord(
        new Triad(root, quality.triadMode),
        quality.intervals.map(interval => root.add(interval))
    );
}

// トライアド+構成音の組にちょうど一致する(ルート, クオリティ)を探す。
// directモードで作った状態をquickモードの選択済み状態として解釈し直すために使う
export function findQualityMatch(
    triad: Triad,
    chordTones: readonly PitchClass[]
): { root: PitchClass; qualityId: KnownQualityId; } | undefined {
    for (const quality of knownQualities) {
        for (const root of PitchClass.all) {
            const expectedChord = qualityToChord(root, quality);
            if (expectedChord.equals(new Chord(triad, chordTones))) {
                return { root, qualityId: quality.id };
            }
        }
    }
    return undefined;
}

// ルートを変えてでも、選ばれた構成音とちょうど一致する既知の形(トライアド/knownQuality)の候補を挙げる。
// 合成表記(getSyntheticNotation)と同じ結果になるものは、異名として挙げる意味がないため除外する
export function getKnownNotations(chord: Chord): string[] {
    const synthetic = chord.getSyntheticNotation();

    const triadNotations = allTriads()
        .filter(candidate => chord.hasSameTones(candidate.getChordTones()))
        .map(candidate => candidate.toString());

    const qualityNotations = PitchClass.all.flatMap(root =>
        knownQualities
            .filter(quality => chord.hasSameTones(qualityToChord(root, quality).chordTones))
            .map(quality => `${root.add(quality.intervals[0]).toString()}${quality.notation}`)
    );

    const candidates = Array.from(new Set([...triadNotations, ...qualityNotations]));
    return candidates.filter(notation => notation !== synthetic);
}