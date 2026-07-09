import { PitchClass } from "./pitch";

export type BasicChordQuality = "major" | "minor";

export type BasicChord = {
    readonly root: PitchClass;
    readonly quality: BasicChordQuality;
};