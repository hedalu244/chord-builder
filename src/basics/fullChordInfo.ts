import { BasicChord } from "./basicChord";
import { PitchClass } from "./pitch";

export class FullChordInfo {
	readonly chord: BasicChord;

	constructor(chord: BasicChord) {
		this.chord = chord;
	}

	equals(other: FullChordInfo): boolean {
		return this.chord.equals(other.chord);
	}

	static createDefault(): FullChordInfo {
		return new FullChordInfo(
			new BasicChord(
				new PitchClass(0),
				"major7"
			)
		);
	}
}

