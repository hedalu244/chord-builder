import { Chord } from "../../basics/chord";
import { ScaleInfo } from "../../basics/scaleInfo";
import { PitchClass } from "../../basics/pitch";
import { Triad } from "../../basics/triad";
import { ContextPosition, ContextVisibility } from "./contextStrip";

// トネッツ図の強調レイヤの語彙。レイヤ指定(TonnetzLayer)の型と、音楽的な対象(コード・スケール)を
// レイヤ指定に対応付けるビルダを提供する。何をどう描くかはtonnetz.tsx、
// 見た目の実体はCSS(tonnetz__*--{className})が担い、ここでは関知しない

// 強調表示の1レイヤ。ピッチクラス/トライアド単位で指定し、無限平面上に周期的に現れる
// 該当箇所すべてに適用される。classNameは tonnetz__node--{className} などのCSSクラスに展開される
export type TonnetzLayer = {
	readonly className: string;
	// 強調するノード
	readonly pitchClasses?: readonly PitchClass[];
	// trueなら、強調ノード同士が隣接している辺も強調する(スケールやコードの形の表示に使う)。
	// 強調された辺の下にはデフォルトの格子線を描かない(半透明の強調線が背景線と二重に見えないように)
	readonly connect?: boolean;
	// 強調する三角形
	readonly triads?: readonly Triad[];
	// ボーダーを二重にする(ストロークだけの円を内側に重ねる)ノード。スケールの主音の強調に使う
	readonly rings?: readonly PitchClass[];
};

// レイヤの強調優先度(薄く: 参照・ホバープレビュー / 通常: 編集対象 / hidden: 何も表示しない)。
export type TonnetzEmphasis = "faint" | "normal" | "hidden";

const hiddenLayer: TonnetzLayer = { className: "hidden" };

// contextStrip上の対象(former/latterのchord・scale)のEmphasis共通ルール:
// hoverされていればnormal、visibleならdefaultEmphasis(既定はfaint)、そうでなければhidden
export function contextEmphasis(
	position: ContextPosition,
	hovered: ContextPosition | undefined,
	visibility: ContextVisibility,
	defaultEmphasis: TonnetzEmphasis,
): TonnetzEmphasis {
	if (position === hovered) return "normal";
	return visibility[position] ? defaultEmphasis : "hidden";
}

// 編集対象(current)のEmphasis共通ルール: current以外がhoverされていればfaintに退き、
// そうでなければdefaultEmphasis
export function currentEmphasis(hovered: ContextPosition | undefined, defaultEmphasis: TonnetzEmphasis): TonnetzEmphasis {
	return (hovered !== undefined && hovered !== "current") ? "faint" : defaultEmphasis;
}

// コード一式(トライアドの塗り・構成音ノード・構成音同士を結ぶ辺)を1つのレイヤとして表す。
// chordが無い、またはemphasisがhiddenのときは何も強調しないレイヤを返す
export function chordLayer(chord: Chord | null | undefined, emphasis: TonnetzEmphasis): TonnetzLayer {
	if (!chord || emphasis === "hidden") return hiddenLayer;
	return {
		className: emphasis,
		triads: [chord.triad],
		pitchClasses: chord.chordTones,
		connect: true,
	};
}

// スケール一式(構成音・連結辺・主音の輪)を編集対象として、faint/normalの強度で表す。
// scaleが無い、またはemphasisがhiddenのときは何も強調しないレイヤを返す
export function scaleLayer(scale: ScaleInfo | null | undefined, emphasis: TonnetzEmphasis | "backdrop"): TonnetzLayer {
	if (!scale || emphasis === "hidden") return hiddenLayer;
	return {
		className: emphasis,
		pitchClasses: scale.getPitchClasses(),
		connect: true,
		rings: [scale.key],
	};
}
