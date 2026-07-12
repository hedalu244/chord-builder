import { Triad, DegreeTriad } from "../../basics/triad";
import { ContextScale } from "../../basics/contextScale";
import { calcRelativeNexus, calcTriadDegree, RelativeNexus } from "../../basics/nexus";
import { PitchClass } from "../../basics/pitch";

type ScaleNexusBlockProps = {
	readonly contextScale: ContextScale | undefined;
	readonly formerTriad: Triad | undefined;
	readonly latterTriad: Triad | undefined;
};

// スケールが定まらなくても、片側のコードだけでその側のDegreeは表示できる
export function ScaleNexusBlock(props: ScaleNexusBlockProps) {
	const { contextScale, formerTriad, latterTriad } = props;
	const former = (formerTriad && contextScale) ? calcTriadDegree(formerTriad, contextScale) : undefined;
	const latter = (latterTriad && contextScale) ? calcTriadDegree(latterTriad, contextScale) : undefined;
	const relative = (formerTriad && latterTriad) ? calcRelativeNexus(formerTriad, latterTriad) : undefined;
	return <NexusBlock former={former} latter={latter} relative={relative} keyLabel={contextScale?.key} />;
}

// NOTE: keyLabelという名前は、Reactの予約propsであるkeyと衝突するのを避けるため
type NexusBlockProps = {
	readonly former: DegreeTriad | undefined;
	readonly latter: DegreeTriad | undefined;
	readonly relative: RelativeNexus | undefined;
	readonly keyLabel: PitchClass | undefined;
};

// nexusの相対/度数/キー説明を表示する。前後のDegreeは独立に表示するため、片側のみでも表示できる。
function NexusBlock(props: NexusBlockProps) {
	const { former, latter, relative, keyLabel } = props;
	return (
		<>
			<div className="nexus-block__relative">{relative ? relative.toString() : "-"}</div>
			<div className="nexus-block__degree">{former ? former.toString() : "_"} → {latter ? latter.toString() : "_"}</div>
			<div className="nexus-block__key">{keyLabel ? `in key=${keyLabel.toString()}` : "-"}</div>
		</>
	);
}
