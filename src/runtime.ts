import { BasicChord } from "./basics/basicChord";
import { ChordVariant } from "./basics/chordVariant";

type FullChordInfo = {
    readonly chord: BasicChord;
    readonly variant: ChordVariant;
}

const chordProgression: FullChordInfo[] = [];

