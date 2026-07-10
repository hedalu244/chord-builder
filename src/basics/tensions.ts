import { Interval } from "./pitch";
import { Scale } from "./scale";

// --- テンション記法 ---
// ノンコードトーンは必ず9/11/13系列の名前で表す。
// ルート～3rdの間なら9系列、3rd～5thの間なら11系列、5th～7th(以降)の間なら13系列とし、
// 実際のコード構成音を基準に区間を判定したうえで、9=長2度・11=完全4度・13=長6度を基準の音として♭/♯を付与する。

const ZONE_ANCHORS = [2, 5, 9]; // 9, 11, 13 それぞれの基準となる半音値(ルートから)
const ZONE_LABELS = ["9", "11", "13"];

function accidentalPrefix(delta: number): string {
    if (delta === 0) return "";
    return delta > 0 ? "♯".repeat(delta) : "♭".repeat(-delta);
}

// value(ルートからの半音値)が、コード構成音(+ルート)を境界とした何番目の区間に入るかを求める
function classifyZoneIndex(value: number, chordToneValues: readonly number[]): number {
    const anchors = Array.from(new Set([0, ...chordToneValues])).sort((a, b) => a - b);
    for (let i = 0; i < anchors.length; i++) {
        const lower = anchors[i];
        const upper = i + 1 < anchors.length ? anchors[i + 1] : anchors[0] + 12;
        if (value > lower && value < upper) {
            return i;
        }
    }
    return anchors.length - 1;
}

// コード構成音を除いた、追加されたテンションのみを名前の配列で返す
export function getExtraTensionNames(scale: Scale, chordTones: readonly Interval[]): string[] {
    const chordToneValues = chordTones.map(tone => tone.value);
    const chordToneValueSet = new Set(chordToneValues);

    return scale.tones
        .filter(tone => !chordToneValueSet.has(tone.value))
        .map(tone => {
            if (tone.value === 0) return "1"; // ルート省略コードにルートを足し戻した場合
            const zoneIndex = Math.min(classifyZoneIndex(tone.value, chordToneValues), ZONE_LABELS.length - 1);
            const anchor = ZONE_ANCHORS[zoneIndex];
            return `${accidentalPrefix(tone.value - anchor)}${ZONE_LABELS[zoneIndex]}`;
        });
}
