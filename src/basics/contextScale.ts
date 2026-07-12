import { Interval, PitchClass } from "./pitch";
import { Scale } from "./scale";

type KnownScale = {
    readonly scale: Scale;
    readonly name: string;
};

const knownScales: readonly KnownScale[] = [
    { scale: new Scale(Interval.map([0, 2, 4, 5, 7, 9, 11])), name: "Major" },
    { scale: new Scale(Interval.map([0, 2, 3, 5, 7, 8, 11])), name: "Harmonic Minor" },
    { scale: new Scale(Interval.map([0, 2, 3, 5, 7, 9, 11])), name: "Melodic Minor" },
    { scale: new Scale(Interval.map([0, 2, 4, 5, 7, 8, 11])), name: "Harmonic Major" },
];

export type ContextScale = {
    readonly key: PitchClass;
    readonly name: string;
};

export const knownScaleNames: readonly string[] = knownScales.map(({ name }) => name);