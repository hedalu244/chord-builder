import { Chord } from "./chord";
import { Interval } from "./pitch";
import { Scale } from "./scale";

// コードの構成音に、extraChordScaleTones(スケールルートから見た追加音)を足し合わせて「コードスケール」を作る。
// 前後のコード進行から決まるcontextScaleとは全く別の概念であることに注意。
export function getChordScale(chord: Chord, extraChordScaleTones: readonly Interval[] | undefined): Scale {
	const chordTones = chord.getChordToneIntervals();
	const extraTones = extraChordScaleTones ?? [];
	return new Scale([...chordTones, ...extraTones]);
}
