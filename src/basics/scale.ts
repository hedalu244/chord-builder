import { Interval, PitchClass } from "./pitch";

// スケール = ルートからの構成音(半音値の集合)。ルート自体の情報は持たない
export class Scale {
    readonly tones: readonly Interval[]; // 昇順、重複なし。必ずInterval(0)を含む

    constructor(tones: readonly Interval[]) {
        const uniqueValues = Array.from(new Set(tones.map(tone => tone.value))).sort((a, b) => a - b);
        this.tones = uniqueValues.map(value => new Interval(value));
    }

    equals(other: Scale): boolean {
        if (this.tones.length !== other.tones.length) return false;
        return this.tones.every((tone, i) => tone.equals(other.tones[i]));
    }

    has(tone: Interval): boolean {
        return this.tones.some(t => t.equals(tone));
    }

    // 構成音を指定した数だけシフトしたスケールを返す。シフト後の構成音は昇順にソートされる
    shift(index: number): Scale {
        const base = this.tones[index % this.tones.length];
        return new Scale(this.tones.map(tone => tone.sub(base)));
    }

    // 自身の構成音がすべてotherに含まれているか
    isSubsetOf(other: Scale): boolean {
        return this.tones.every(tone => other.has(tone));
    }

    // rootを与えて構成音を実際のPitchClassに変換する(rootはこのクラスの状態としては持たない)
    getPitchClasses(root: PitchClass): PitchClass[] {
        return this.tones.map(tone => root.add(tone));
    }
}