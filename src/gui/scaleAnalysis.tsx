import { FullChordInfo } from "../basics/fullChordInfo";
import { findKnownScale } from "../basics/knownScale";
import { getChordToneIntervals, Scale } from "../basics/scale";
import { getExtraTensionNames } from "../basics/tensions";

type ScaleAnalysisProps = {
	readonly chordInfo: FullChordInfo;
	readonly scale: Scale; // モーダル編集中はまだchordInfoに反映されていないプレビュー値になりうる
};

// スケールパネル/スケールモーダルで共通の、構成音以外の分析情報(名前・ペアレントスケール由来・テンション記法)
export function ScaleAnalysis(props: ScaleAnalysisProps) {
	const { chordInfo, scale } = props;
	const known = findKnownScale(scale);
	const rootName = scale.root.toString();
	const tensionNames = getExtraTensionNames(scale, getChordToneIntervals(chordInfo));

	return (
		<div className="scale-analysis">
			<h4 className="scale-analysis__tension">
				{chordInfo.toString()}
				{tensionNames.length > 0 && <sup> ({tensionNames.join(", ")})</sup>}
			</h4>
			<span className="scale-analysis__name">{known ? `${rootName} ${known.name}` : "Unknown Scale"}</span>
			<span className="scale-analysis__origin">
				{known ? `${known.parentRoot.toString()} ${known.parentScaleName} shift ${known.shift}` : "-"}
			</span>
		</div>
	);
}
