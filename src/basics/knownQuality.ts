import { Interval } from "./pitch";
import { Mode } from "./triad";

// 現時点ではどこからも参照されない。後々、選ばれた構成音から名前を推定する処理などで使うためのデータベースと型のみを残す
export type KnownQuality = {
    readonly notation: string;
    readonly mode: Mode;
    readonly intervals: readonly Interval[]; // もとのルートからの相対的な音程の配列
};

export const knownQualities: readonly KnownQuality[] = [
    { notation: "m7", mode: "m", intervals: Interval.map([0, 3, 7, 10]) },

    { notation: "M7", mode: "M", intervals: Interval.map([0, 4, 7, 11]) },
    { notation: "6", mode: "M", intervals: Interval.map([0, 4, 7, 9]) },
    { notation: "7", mode: "M", intervals: Interval.map([0, 4, 7, 10]) },
    { notation: "dim7", mode: "M", intervals: Interval.map([4, 7, 10, 1]) },
    { notation: "m7-5", mode: "M", intervals: Interval.map([4, 7, 10, 2]) },
];
