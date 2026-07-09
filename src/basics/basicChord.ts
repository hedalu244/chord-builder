import { PitchClass } from "./pitch";
import { ChordQualityId, findChordQuality } from "./chordQuality";

export type BasicChord = {
    readonly root: PitchClass;
    readonly qualityId: ChordQualityId;
};

export function getPitchClasses(chord: BasicChord): PitchClass[] {
    const quality = findChordQuality(chord.qualityId);
    const intervals = quality.intervals;
    return intervals.map(interval => chord.root.add(interval));
}