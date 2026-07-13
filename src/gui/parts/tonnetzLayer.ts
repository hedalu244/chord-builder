import { Chord } from "../../basics/chord";
import { ScaleInfo } from "../../basics/scaleInfo";
import { PitchClass } from "../../basics/pitch";
import { Triad } from "../../basics/triad";

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
	// trueなら、3頂点すべてが強調ノードに含まれる三角形も塗る(スケールに含まれるトライアドの表示に使う)
	readonly fillContained?: boolean;
	// 強調する三角形
	readonly triads?: readonly Triad[];
	// ボーダーを二重にする(ストロークだけの円を内側に重ねる)ノード。スケールの主音の強調に使う
	readonly rings?: readonly PitchClass[];
};

// レイヤの強調優先度(薄く: 参照・ホバープレビュー / 通常: 編集対象)
export type TonnetzEmphasis = "faint" | "normal";

// コード一式(トライアドの塗り・構成音ノード・構成音同士を結ぶ辺)を1つのレイヤとして表す
export function chordLayer(chord: Chord, emphasis: TonnetzEmphasis): TonnetzLayer {
	return {
		className: emphasis,
		triads: [chord.triad],
		pitchClasses: chord.chordTones,
		connect: true,
	};
}

// contextScaleの参照表示: スケールの形(構成音・連結辺・含まれるトライアドの塗り・主音の輪)を
// 背景レイヤとして表す。半透明の見た目はCSS側(--backdrop)が担う
export function scaleBackdropLayer(scale: ScaleInfo): TonnetzLayer {
	return {
		className: "backdrop",
		pitchClasses: scale.getPitchClasses(),
		connect: true,
		fillContained: true,
		rings: [scale.key],
	};
}

// スケール一式(構成音・連結辺・主音の輪)を編集対象として、faint/normalの強度で表す
export function scaleLayer(scale: ScaleInfo, emphasis: TonnetzEmphasis): TonnetzLayer {
	return {
		className: emphasis,
		pitchClasses: scale.getPitchClasses(),
		connect: true,
		rings: [scale.key],
	};
}
