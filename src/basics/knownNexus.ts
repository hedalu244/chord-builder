import { DegreeTriad, Mode } from "./triad";
import { DegreeNexus } from "./nexus";
import { PitchClass } from "./pitch";

// とりあえずI, IIm, IIIm, IV, V, VIm, の6つの組み合わせを入れてみる
export const KnownNexi: readonly DegreeNexus[] = [
    new DegreeNexus(DegreeTriad.parse("I"), DegreeTriad.parse("IIm")),
    new DegreeNexus(DegreeTriad.parse("I"), DegreeTriad.parse("IIIm")),
    new DegreeNexus(DegreeTriad.parse("I"), DegreeTriad.parse("IV")),
    new DegreeNexus(DegreeTriad.parse("I"), DegreeTriad.parse("V")),
    new DegreeNexus(DegreeTriad.parse("I"), DegreeTriad.parse("VIm")),

    new DegreeNexus(DegreeTriad.parse("IIm"), DegreeTriad.parse("I")),
    new DegreeNexus(DegreeTriad.parse("IIm"), DegreeTriad.parse("IIIm")),
    new DegreeNexus(DegreeTriad.parse("IIm"), DegreeTriad.parse("IV")),
    new DegreeNexus(DegreeTriad.parse("IIm"), DegreeTriad.parse("V")),
    new DegreeNexus(DegreeTriad.parse("IIm"), DegreeTriad.parse("VIm")),

    new DegreeNexus(DegreeTriad.parse("IIIm"), DegreeTriad.parse("I")),
    new DegreeNexus(DegreeTriad.parse("IIIm"), DegreeTriad.parse("IIm")),
    new DegreeNexus(DegreeTriad.parse("IIIm"), DegreeTriad.parse("IV")),
    new DegreeNexus(DegreeTriad.parse("IIIm"), DegreeTriad.parse("V")),
    new DegreeNexus(DegreeTriad.parse("IIIm"), DegreeTriad.parse("VIm")),

    new DegreeNexus(DegreeTriad.parse("IV"), DegreeTriad.parse("I")),
    new DegreeNexus(DegreeTriad.parse("IV"), DegreeTriad.parse("IIm")),
    new DegreeNexus(DegreeTriad.parse("IV"), DegreeTriad.parse("IIIm")),
    new DegreeNexus(DegreeTriad.parse("IV"), DegreeTriad.parse("V")),
    new DegreeNexus(DegreeTriad.parse("IV"), DegreeTriad.parse("VIm")),

    new DegreeNexus(DegreeTriad.parse("V"), DegreeTriad.parse("I")),
    new DegreeNexus(DegreeTriad.parse("V"), DegreeTriad.parse("IIm")),
    new DegreeNexus(DegreeTriad.parse("V"), DegreeTriad.parse("IIIm")),
    new DegreeNexus(DegreeTriad.parse("V"), DegreeTriad.parse("IV")),
    new DegreeNexus(DegreeTriad.parse("V"), DegreeTriad.parse("VIm")),

    new DegreeNexus(DegreeTriad.parse("VIm"), DegreeTriad.parse("I")),
    new DegreeNexus(DegreeTriad.parse("VIm"), DegreeTriad.parse("IIm")),
    new DegreeNexus(DegreeTriad.parse("VIm"), DegreeTriad.parse("IIIm")),
    new DegreeNexus(DegreeTriad.parse("VIm"), DegreeTriad.parse("IV")),
    new DegreeNexus(DegreeTriad.parse("VIm"), DegreeTriad.parse("V")),
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