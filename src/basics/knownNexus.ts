import { TriadDegree, Mode } from "./triad";
import { DegreeNexus } from "./nexus";
import { PitchClass } from "./pitch";

// とりあえずI, IIm, IIIm, IV, V, VIm, の6つの組み合わせを入れてみる
export const KnownNexi: readonly DegreeNexus[] = [
    new DegreeNexus(TriadDegree.parse("I"), TriadDegree.parse("IIm")),
    new DegreeNexus(TriadDegree.parse("I"), TriadDegree.parse("IIIm")),
    new DegreeNexus(TriadDegree.parse("I"), TriadDegree.parse("IV")),
    new DegreeNexus(TriadDegree.parse("I"), TriadDegree.parse("V")),
    new DegreeNexus(TriadDegree.parse("I"), TriadDegree.parse("VIm")),

    new DegreeNexus(TriadDegree.parse("IIm"), TriadDegree.parse("I")),
    new DegreeNexus(TriadDegree.parse("IIm"), TriadDegree.parse("IIIm")),
    new DegreeNexus(TriadDegree.parse("IIm"), TriadDegree.parse("IV")),
    new DegreeNexus(TriadDegree.parse("IIm"), TriadDegree.parse("V")),
    new DegreeNexus(TriadDegree.parse("IIm"), TriadDegree.parse("VIm")),

    new DegreeNexus(TriadDegree.parse("IIIm"), TriadDegree.parse("I")),
    new DegreeNexus(TriadDegree.parse("IIIm"), TriadDegree.parse("IIm")),
    new DegreeNexus(TriadDegree.parse("IIIm"), TriadDegree.parse("IV")),
    new DegreeNexus(TriadDegree.parse("IIIm"), TriadDegree.parse("V")),
    new DegreeNexus(TriadDegree.parse("IIIm"), TriadDegree.parse("VIm")),

    new DegreeNexus(TriadDegree.parse("IV"), TriadDegree.parse("I")),
    new DegreeNexus(TriadDegree.parse("IV"), TriadDegree.parse("IIm")),
    new DegreeNexus(TriadDegree.parse("IV"), TriadDegree.parse("IIIm")),
    new DegreeNexus(TriadDegree.parse("IV"), TriadDegree.parse("V")),
    new DegreeNexus(TriadDegree.parse("IV"), TriadDegree.parse("VIm")),

    new DegreeNexus(TriadDegree.parse("V"), TriadDegree.parse("I")),
    new DegreeNexus(TriadDegree.parse("V"), TriadDegree.parse("IIm")),
    new DegreeNexus(TriadDegree.parse("V"), TriadDegree.parse("IIIm")),
    new DegreeNexus(TriadDegree.parse("V"), TriadDegree.parse("IV")),
    new DegreeNexus(TriadDegree.parse("V"), TriadDegree.parse("VIm")),

    new DegreeNexus(TriadDegree.parse("VIm"), TriadDegree.parse("I")),
    new DegreeNexus(TriadDegree.parse("VIm"), TriadDegree.parse("IIm")),
    new DegreeNexus(TriadDegree.parse("VIm"), TriadDegree.parse("IIIm")),
    new DegreeNexus(TriadDegree.parse("VIm"), TriadDegree.parse("IV")),
    new DegreeNexus(TriadDegree.parse("VIm"), TriadDegree.parse("V")),
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