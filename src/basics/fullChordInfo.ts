import { BasicChord } from "./basicChord";
import { PitchClass } from "./pitch";
import { ChordVariant, chordVariants } from "./chordVariant";

export type FullChordInfo = {
	readonly chord: BasicChord;
	readonly variant: ChordVariant;
};

export function copyChordInfo(chordInfo: FullChordInfo): FullChordInfo {
	return {
		chord: {
			root: new PitchClass(chordInfo.chord.root.value),
			quality: chordInfo.chord.quality
		},
		variant: chordInfo.variant
	};
}

export function copyProgression(progression: readonly FullChordInfo[]): FullChordInfo[] {
	return progression.map(copyChordInfo);
}

export function isSameChordInfo(left: FullChordInfo, right: FullChordInfo): boolean {
	return (
		left.chord.root.value === right.chord.root.value &&
		left.chord.quality === right.chord.quality &&
		left.variant.name === right.variant.name
	);
}

export function createDefaultChordInfo(): FullChordInfo {
	const variants = chordVariants["major"];
	const defaultVariant = variants[0];
	if (defaultVariant === undefined) {
		throw new Error("missing default major variant");
	}

	return {
		chord: {
			root: new PitchClass(0),
			quality: "major"
		},
		variant: defaultVariant
	};
}
