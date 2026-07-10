import { BasicChord } from "./basicChord";
import { ChordQualityId, findChordQuality } from "./chordQuality";
import { Interval, PitchClass } from "./pitch";
import { Scale } from "./scale";

export class FullChordInfo {
	readonly chord: BasicChord;
	readonly qualityId: ChordQualityId | undefined;
	// undefined(または空配列) = デフォルトスケール(コード構成音のみ)。それ以外はコード構成音に追加する音(スケールルートからの半音値)
	readonly extraScaleTones: readonly Interval[] | undefined;

	constructor(chord: BasicChord, qualityId: ChordQualityId | undefined, extraScaleTones: readonly Interval[] | undefined = undefined) {
		this.chord = chord;
		this.qualityId = qualityId;
		this.extraScaleTones = extraScaleTones;
	}

	equals(other: FullChordInfo): boolean {
		if (!this.chord.equals(other.chord) || this.qualityId !== other.qualityId) return false;
		const tones = this.extraScaleTones ?? [];
		const otherTones = other.extraScaleTones ?? [];
		if (tones.length !== otherTones.length) return false;
		return tones.every((tone, i) => tone.equals(otherTones[i]));
	}

	toString(): string {
		if (this.qualityId === undefined) {
			return this.chord.toString();
		}
		return `${findChordQuality(this.qualityId).getNotation(this.chord)}`;
	}

	// ルート/モードの変更。スケールの形(ルートからの相対音程)はそのまま保たれる
	withChord(chord: BasicChord): FullChordInfo {
		return new FullChordInfo(chord, this.qualityId, this.extraScaleTones);
	}

	// クオリティの変更。実際に変わる場合はスケールをデフォルトにリセットする
	withQuality(qualityId: ChordQualityId | undefined): FullChordInfo {
		if (qualityId === this.qualityId) return this;
		return new FullChordInfo(this.chord, qualityId, undefined);
	}

	withExtraScaleTones(extraScaleTones: readonly Interval[] | undefined): FullChordInfo {
		return new FullChordInfo(this.chord, this.qualityId, extraScaleTones);
	}

	// スケールのルート。basicChordのルートではなく、Quality.getRootで得られるルート
	getChordRoot(): PitchClass {
		if (this.qualityId === undefined) {
			return this.chord.root;
		}
		return findChordQuality(this.qualityId).getRoot(this.chord);
	}

	getChordToneIntervals(): Interval[] {
		const root = this.getChordRoot();
		const pitchClasses = this.qualityId === undefined
			? this.chord.getChordTones()
			: findChordQuality(this.qualityId).getChordTones(this.chord.root);
		return pitchClasses.map(pitchClass => pitchClass.delta(root));
	}

	getScale(): Scale {
		const chordTones = this.getChordToneIntervals();
		const extraTones = this.extraScaleTones ?? [];
		return new Scale([...chordTones, ...extraTones]);
	}
}
