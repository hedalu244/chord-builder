import { BasicChord } from "./basicChord";
import { ChordQualityId, findChordQuality } from "./chordQuality";

export class FullChordInfo {
	readonly chord: BasicChord;
	readonly qualityId: ChordQualityId | undefined;

	constructor(chord: BasicChord, qualityId: ChordQualityId | undefined) {
		this.chord = chord;
		this.qualityId = qualityId;
	}

	equals(other: FullChordInfo): boolean {
		return this.chord.equals(other.chord) && this.qualityId === other.qualityId;
	}

	toString(): string {
		if (this.qualityId === undefined) {
			return this.chord.toString();
		}
		return `${this.chord.root.toString()}${findChordQuality(this.qualityId).notation}`;
	}
}
