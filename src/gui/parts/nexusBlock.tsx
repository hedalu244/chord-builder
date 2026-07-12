import { Triad, DegreeTriad } from "../../basics/triad";
import { ContextScale } from "../../basics/contextScale";
import { calcRelativeNexus, calcTriadDegree, RelativeNexus } from "../../basics/nexus";
import { PitchClass } from "../../basics/pitch";

type ScaleNexusBlockProps = {
	readonly contextScale: ContextScale | undefined;
	readonly formerChord: Triad | undefined;
	readonly latterChord: Triad | undefined;
};

// スケールが定まらなくても、片側のコードだけでその側のDegreeは表示できる
export function ScaleNexusBlock(props: ScaleNexusBlockProps) {
	const { contextScale, formerChord, latterChord } = props;
	const former = (formerChord && contextScale) ? calcTriadDegree(formerChord, contextScale) : undefined;
	const latter = (latterChord && contextScale) ? calcTriadDegree(latterChord, contextScale) : undefined;
	const relative = (formerChord && latterChord) ? calcRelativeNexus(formerChord, latterChord) : undefined;
	return <NexusBlock former={former} latter={latter} relative={relative} keyLabel={contextScale?.key} />;
}

// NOTE: keyLabelという名前は、JSXのspread先で予約語のkeyと衝突するのを避けるため
type NexusBlockProps = {
	readonly former: DegreeTriad | undefined;
	readonly latter: DegreeTriad | undefined;
	readonly relative: RelativeNexus | undefined;
	readonly keyLabel: PitchClass | undefined;
};

// nexusの相対/度数/キー説明を表示する。前後のDegreeは独立に表示するため、片側のみでも表示できる。
export function NexusBlock(props: NexusBlockProps) {
	const { former, latter, relative, keyLabel } = props;
	return (
		<>
			<div className="nexus-block__relative">{relative ? relative.toString() : "-"}</div>
			<div className="nexus-block__degree">{former ? former.toString() : "_"} → {latter ? latter.toString() : "_"}</div>
			<div className="nexus-block__key">{keyLabel ? `in key=${keyLabel.toString()}` : "-"}</div>
		</>
	);
}
