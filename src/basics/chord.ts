import { Interval, PitchClass } from "./pitch";
import { allTriads, ModeToNotation, Triad } from "./triad";
import { knownQualities, qualityToChord } from "./knownQuality";
import { getOmittedDegreeNames, getTensionNames } from "./tensions";

export class Chord {
    readonly triad: Triad;
    readonly chordTones: readonly PitchClass[]; // 重複のないピッチクラス配列。triadの構成音をすべて含むとは限らない
    constructor(triad: Triad, chordTones: readonly PitchClass[]) {
        this.triad = triad;
        const uniqueValues = Array.from(new Set(chordTones.map(tone => tone.value))).sort((a, b) => a - b);
        this.chordTones = PitchClass.map(uniqueValues);
    }

    // 素のトライアド(テンション等を持たない)のコードを生成
    static bareTriad(triad: Triad): Chord {
        return new Chord(triad, triad.getChordTones());
    }

    equals(other: Chord): boolean {
        if (this.chordTones.length !== other.chordTones.length) return false;
        if (!this.triad.equals(other.triad)) return false;
        for (let i = 0; i < this.chordTones.length; i++) {
            if (!this.chordTones[i].equals(other.chordTones[i])) return false;
        }
        return true;
    }

    // ルート、トライアド違いを無視して構成音だけを比較
    hasSameTones(tones: readonly PitchClass[]): boolean {
        if (this.chordTones.length !== tones.length) return false;
        return tones.every(tone => this.chordTones.some(chordTone => chordTone.equals(tone)));
    }

    // トライアドのルートから見た構成音の音程値配列
    getChordToneIntervals(): Interval[] {
        const root = this.triad.root;
        return this.chordTones.map(tone => tone.delta(root));
    }

    // トライアドのルートを固定し、triadの構成音との差分(省略/追加)を逐一書き足して表記を組み立てる。
    // 6th/7th/M7thはモード直後に括弧なしで付く特殊な表記のため先に判定し、9/11/13系のテンションと省略はその後の差分として扱う。
    // 6thは7th/M7thと共存できず、その場合は13としてテンション側に回る。
    // テンション・省略の括弧書きは添え字(sup)として小さく表示できるよう、本体と分けたパーツで返す
    getSyntheticNotationParts(): { base: string; tension: string; omit: string } {
        const root = this.triad.root;
        const triadTones = this.triad.getChordTones();
        const triadRelativeTones = triadTones.map(tone => tone.delta(root));
        const relativeTones = this.getChordToneIntervals();
        const relativeValues = new Set(relativeTones.map(interval => interval.value));

        const hasM7 = relativeValues.has(11);
        const has7 = relativeValues.has(10);
        const has6 = !has7 && !hasM7 && relativeValues.has(9);

        let headlineNotation = "";
        const headlineValues: number[] = [];
        if (has6) { headlineNotation += "6"; headlineValues.push(9); }
        if (has7) { headlineNotation += "7"; headlineValues.push(10); }
        if (hasM7) { headlineNotation += "M7"; headlineValues.push(11); }

        const omittedNames = getOmittedDegreeNames(triadRelativeTones, relativeTones);

        const anchorTones = Interval.map([...triadRelativeTones.map(interval => interval.value), ...headlineValues]);
        const anchorValues = new Set(anchorTones.map(interval => interval.value));
        const extraTones = relativeTones.filter(interval => !anchorValues.has(interval.value));
        const tensionNames = getTensionNames(extraTones, anchorTones);

        return {
            base: `${root.toString()}${ModeToNotation(this.triad.mode)}${headlineNotation}`,
            tension: tensionNames.length > 0 ? `(${tensionNames.join(", ")})` : "",
            omit: omittedNames.length > 0 ? `(omit ${omittedNames.join(", ")})` : "",
        };
    }

    getSyntheticNotation(): string {
        const parts = this.getSyntheticNotationParts();
        return `${parts.base}${parts.tension}${parts.omit}`;
    }
}
