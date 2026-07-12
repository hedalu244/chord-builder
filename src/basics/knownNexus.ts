import { ChordDegree, Mode, BasicChord } from "./basicChord";
import { DegreeNexus } from "./nexus";
import { PitchClass } from "./pitch";

// とりあえずI, IIm, IIIm, IV, V, VIm, の6つの組み合わせを入れてみる
export const KnownNexi: readonly DegreeNexus[] = [
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("V")),
    new DegreeNexus(ChordDegree.parse("I"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("V")),
    new DegreeNexus(ChordDegree.parse("IIm"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("V")),
    new DegreeNexus(ChordDegree.parse("IIIm"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("V")),
    new DegreeNexus(ChordDegree.parse("IV"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("V"), ChordDegree.parse("VIm")),

    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("I")),
    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("IIm")),
    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("IIIm")),
    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("IV")),
    new DegreeNexus(ChordDegree.parse("VIm"), ChordDegree.parse("V")),
];

function knownNexiByFormerMode(mode: Mode): readonly DegreeNexus[] {
    return KnownNexi.filter(degreeNexus => degreeNexus.relativeNexus.formerMode === mode);
}
function knownNexiByLatterMode(mode: Mode): readonly DegreeNexus[] {
    return KnownNexi.filter(degreeNexus => degreeNexus.relativeNexus.latterMode === mode);
}

export type KnownNexusInfo = {
    readonly nexus: DegreeNexus; // ルートのキーを基準にした度数接続
    // 名前とかの追加情報が今後あるかもしれない
};