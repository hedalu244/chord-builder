import { BasicChord } from "../basics/basicChord";
import { calcRelativeNexus, findMatchingNexus } from "../basics/nexus";

type NexusPanelProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
};

function formatKnownNexus(formerChord: BasicChord, latterChord: BasicChord): { degree: string; key: string } {
	const matches = findMatchingNexus(formerChord, latterChord);
	const primary = matches[0];
	if (primary) {
		const former = primary.nexus.formerChordDegree;
		const latter = primary.nexus.latterChordDegree;
		return {
			degree: `${former.degree.toString()} → ${latter.degree.toString()}`,
			key: `in key=${primary.key.toString()}`
		};
	}

	const relative = calcRelativeNexus(formerChord, latterChord);
	return {
		degree: `${relative.formerMode} → ${relative.latterMode}, ${relative.rootMotion.toStringRelative()}`,
		key: "unknown nexus"
	};
}

export function NexusPanel(props: NexusPanelProps) {
	const { formerChord, latterChord } = props;
	const nexus = formatKnownNexus(formerChord, latterChord);

	return (
		<div className="nexus-panel">
			<div className="nexus-panel__degree">{nexus.degree}</div>
			<div className="nexus-panel__key">{nexus.key}</div>
		</div>
	);
}

export function DummyNexusPanel() {
    return (
        <div className="nexus-panel nexus-panel--dummy">
        </div>
    );
}