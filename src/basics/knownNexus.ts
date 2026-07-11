import { ChordDegree, Mode, BasicChord } from "./basicChord";
import { DegreeNexus, KeyNexus } from "./nexus";
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

// E-A as V-I in key=A みたいな情報。
export type KnownNexusInfo = {
    readonly keyNexus: KeyNexus;
    // 名前とかの追加情報が今後あるかもしれない
};

// former/latterの指定状況に応じて、成立するKnownNexiの解釈をすべて返す。
// 両方指定: 12キーそれぞれで両コードの度数がKnownNexiに一致するものを探す(従来のfindMatchingNexus)
// 片方のみ指定: そのコードのmodeで絞り込み、残りのコード・キーは固定コードから逆算する
// 両方未指定: 12キー×KnownNexiの直積(全体集合)
export function findMatchingNexus(
    former: BasicChord | undefined,
    latter: BasicChord | undefined
): readonly KnownNexusInfo[] {
    if (former !== undefined && latter !== undefined) {
        return KnownNexi.filter(degreeNexus => degreeNexus.match(former, latter)).map(degreeNexus =>
            ({ keyNexus: degreeNexus.resolveFromFormerChord(former) }));
    }
    if (former !== undefined) {
        return knownNexiByFormerMode(former.mode).map(degreeNexus =>
            ({ keyNexus: degreeNexus.resolveFromFormerChord(former) })
        );
    }
    if (latter !== undefined) {
        return knownNexiByLatterMode(latter.mode).map(degreeNexus =>
            ({ keyNexus: degreeNexus.resolveFromLatterChord(latter) })
        );
    }
    return PitchClass.all.flatMap(key => KnownNexi.map(degreeNexus => ({ keyNexus: degreeNexus.resolveFromKey(key) })));
}
