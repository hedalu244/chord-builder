import { Interval, PitchClass } from "./pitch";

export type BasicChordQuality = "major" | "minor";

const basicChordIntervals: { [key in BasicChordQuality]: Interval[] } = {
    "major": Interval.map([0, 4, 7]),
    "minor": Interval.map([0, 3, 7])
};

export type BasicChord = {
    readonly root: PitchClass;
    readonly quality: BasicChordQuality;
};

export function getBasicPitchClasses(chord: BasicChord): PitchClass[] {
    const intervals = basicChordIntervals[chord.quality];
    return intervals.map(interval => chord.root.add(interval));
}