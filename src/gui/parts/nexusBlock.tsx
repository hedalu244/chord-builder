import { BasicChord } from "../../basics/basicChord";
import { ContextScale, estimateContextScale } from "../../basics/contextScale";
import { calcDegreeNexus, DegreeNexus } from "../../basics/nexus";
import { PitchClass } from "../../basics/pitch";

type ScaleNexusBlockProps = {
	readonly contextScale: ContextScale | undefined;
	readonly formerChord: BasicChord | undefined;
	readonly latterChord: BasicChord | undefined;
};

// contextScale未指定の場合、前後のコードが両方揃っていれば推定値をフォールバックとして使う。
// 前後どちらかのコードが未選択(プレースホルダー)の場合はunknown表示にフォールする
export function ScaleNexusBlock(props: ScaleNexusBlockProps) {
	const { contextScale, formerChord, latterChord } = props;
	const resolvedContextScale = contextScale ?? (formerChord && latterChord ? estimateContextScale(formerChord, latterChord) : undefined);
	const degreeNexus = (resolvedContextScale && formerChord && latterChord) ? calcDegreeNexus(formerChord, latterChord, resolvedContextScale) : undefined;
	return <NexusBlock degreeNexus={degreeNexus} keyLabel={resolvedContextScale?.key} />;
}

// NOTE: keyLabelという名前は、JSXのspread先で予約語のkeyと衝突するのを避けるため
type NexusBlockProps = {
	readonly degreeNexus: DegreeNexus | undefined;
	readonly keyLabel: PitchClass | undefined;
};

// nexusの相対/度数/キー説明を表示する。
export function NexusBlock(props: NexusBlockProps) {
	const { degreeNexus, keyLabel } = props;
	return (
		<>
			<div className="nexus-block__relative">{degreeNexus ? degreeNexus.relativeNexus.toString() : "-"}</div>
			<div className="nexus-block__degree">{degreeNexus ? degreeNexus.toString() : "unknown"}</div>
			<div className="nexus-block__key">{keyLabel ? `in key=${keyLabel.toString()}` : "-"}</div>
		</>
	);
}
