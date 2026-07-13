import { Interval, PitchClass } from "./pitch";
import { Mode, Triad } from "./triad";

// 既知のコードクオリティ。命名(getKnownNotations)と、クイック入力(クオリティ+ルートから
// トライアドと構成音を一発で決める)の両方から参照される共通データ。
// intervalsはクオリティのルートからの相対音程(先頭は必ず0とは限らないがルート自身を含む形で正規化しておく)。
// 土台トライアドのルートはクオリティのルートと一致するとは限らない。例えばdim7は自身の構成音に
// トライアドを含まないため、便宜上2音が一致する半音下のメジャートライアドを土台とする
// (C#dim7の土台はC)。triadOffsetは「クオリティのルート→土台トライアドのルート」の音程
export type KnownQuality = {
    readonly notation: string;
    readonly intervals: readonly Interval[];
    readonly triadOffset: Interval;
    readonly triadMode: Mode;
};

export const knownQualities: readonly KnownQuality[] = [
    { notation: "", intervals: Interval.map([0, 4, 7]), triadOffset: new Interval(0), triadMode: "M" },
    { notation: "m", intervals: Interval.map([0, 3, 7]), triadOffset: new Interval(0), triadMode: "m" },
    { notation: "6", intervals: Interval.map([0, 4, 7, 9]), triadOffset: new Interval(0), triadMode: "M" },
    { notation: "7", intervals: Interval.map([0, 4, 7, 10]), triadOffset: new Interval(0), triadMode: "M" },
    { notation: "M7", intervals: Interval.map([0, 4, 7, 11]), triadOffset: new Interval(0), triadMode: "M" },
    { notation: "m7", intervals: Interval.map([0, 3, 7, 10]), triadOffset: new Interval(0), triadMode: "m" },
    // m7-5は構成音に短3度上のマイナートライアドを完全に含む(Cm7-5 ⊃ Ebm)ため、それを土台とする
    { notation: "m7-5", intervals: Interval.map([0, 3, 6, 10]), triadOffset: new Interval(3), triadMode: "m" },
    { notation: "dim7", intervals: Interval.map([0, 3, 6, 9]), triadOffset: new Interval(-1), triadMode: "M" },
];

// プルダウン等での表示名。素のトライアド(notationが空/"m")はそのままだと分かりにくいので補う
export function qualityLabel(quality: KnownQuality): string {
    if (quality.intervals.length === 3) {
        return quality.triadMode === "M" ? "M (triad)" : "m (triad)";
    }
    return quality.notation;
}

// クオリティのルートに対する土台トライアド
export function qualityTriad(root: PitchClass, quality: KnownQuality): Triad {
    return new Triad(root.add(quality.triadOffset), quality.triadMode);
}

// クオリティのルートに対する構成音
export function qualityTones(root: PitchClass, quality: KnownQuality): PitchClass[] {
    return quality.intervals.map(interval => root.add(interval));
}

// トライアド+構成音の組にちょうど一致する(ルート, クオリティ)を探す。
// directモードで作った状態をquickモードの選択済み状態として解釈し直すために使う
export function findQualityMatch(
    triad: Triad,
    toneValues: ReadonlySet<number>
): { root: PitchClass; qualityIndex: number } | undefined {
    for (let qualityIndex = 0; qualityIndex < knownQualities.length; qualityIndex++) {
        const quality = knownQualities[qualityIndex];
        for (const root of PitchClass.all) {
            if (!qualityTriad(root, quality).equals(triad)) continue;
            const tones = qualityTones(root, quality);
            if (tones.length !== toneValues.size) continue;
            if (tones.every(tone => toneValues.has(tone.value))) {
                return { root, qualityIndex };
            }
        }
    }
    return undefined;
}
