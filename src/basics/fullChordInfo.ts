import { BasicChord } from "./basicChord";
import { PitchClass } from "./pitch";

export type FullChordInfo = {
	readonly chord: BasicChord;
};

export function copyChordInfo(chordInfo: FullChordInfo): FullChordInfo {
	return {
		chord: {
			root: new PitchClass(chordInfo.chord.root.value),
			qualityId: chordInfo.chord.qualityId
		}
	};
}

export function isSameChordInfo(left: FullChordInfo, right: FullChordInfo): boolean {
	return (
		left.chord.root.value === right.chord.root.value &&
		left.chord.qualityId === right.chord.qualityId
	);
}

export function createDefaultChordInfo(): FullChordInfo {
	return {
		chord: {
			root: new PitchClass(0),
			qualityId: "major7"
		},
	};
}
