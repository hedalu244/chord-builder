import { Interval } from "./pitch";
import { Scale } from "./scale";

// --- テンション記法 ---
// ノンコードトーンは必ず9/11/13系列の名前で表す。
// ルート～3rdの間なら9系列、3rd～5thの間なら11系列、5th～7th(以降)の間なら13系列とし、
// 実際のアンカー(コード構成音)を基準に区間を判定したうえで、9=長2度・11=完全4度・13=長6度を基準の音として♭/♯を付与する。

const ZONE_ANCHORS = [2, 5, 9]; // 9, 11, 13 それぞれの基準となる半音値(ルートから)
const ZONE_LABELS = ["9", "11", "13"];

function accidentalPrefix(delta: number): string {
    if (delta === 0) return "";
    return delta > 0 ? "♯".repeat(delta) : "♭".repeat(-delta);
}

// value(ルートからの半音値)が、アンカー(ルート+コード構成音)を境界とした何番目の区間に入るかを求める
function classifyZoneIndex(value: number, anchorValues: readonly number[]): number {
    const anchors = Array.from(new Set([0, ...anchorValues])).sort((a, b) => a - b);
    for (let i = 0; i < anchors.length; i++) {
        const lower = anchors[i];
        const upper = i + 1 < anchors.length ? anchors[i + 1] : anchors[0] + 12;
        if (value > lower && value < upper) {
            return i;
        }
    }
    return anchors.length - 1;
}

// value(ルートからの半音値)を、anchorValuesを基準にした9/11/13系のテンション名にする
function tensionName(value: number, anchorValues: readonly number[]): string {
    if (value === 0) return "1"; // ルート省略コードにルートを足し戻した場合
    const zoneIndex = Math.min(classifyZoneIndex(value, anchorValues), ZONE_LABELS.length - 1);
    const anchor = ZONE_ANCHORS[zoneIndex];
    return `${accidentalPrefix(value - anchor)}${ZONE_LABELS[zoneIndex]}`;
}

// tones(ルートからの音程の配列)を、anchorTones(コード構成音)を基準にした9/11/13系のテンション名の配列にする
export function getTensionNames(tones: readonly Interval[], anchorTones: readonly Interval[]): string[] {
    const anchorValues = anchorTones.map(tone => tone.value);
    return tones.map(tone => tensionName(tone.value, anchorValues));
}

// コード構成音を除いた、スケールに追加されたテンションのみを名前の配列で返す
export function getExtraTensionNames(scale: Scale, chordTones: readonly Interval[]): string[] {
    const chordToneValueSet = new Set(chordTones.map(tone => tone.value));
    const extraTones = scale.tones.filter(tone => !chordToneValueSet.has(tone.value));
    return getTensionNames(extraTones, chordTones);
}

// アンカー(root/3rd/5th相当)の代表的な半音値を度数名(1/3/5)にする
function coreDegreeName(value: number): string {
    if (value === 0) return "1";
    if (value === 7) return "5";
    return "3"; // 3(短3度)/4(長3度)のどちらもここに来る
}

// anchorTones(通常はトライアドの構成音)のうち、actualTonesに含まれないものを度数名(1/3/5)の配列で返す
export function getOmittedDegreeNames(anchorTones: readonly Interval[], actualTones: readonly Interval[]): string[] {
    const actualValueSet = new Set(actualTones.map(tone => tone.value));
    return anchorTones
        .filter(tone => !actualValueSet.has(tone.value))
        .map(tone => coreDegreeName(tone.value));
}
