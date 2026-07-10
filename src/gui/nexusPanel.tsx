import { BasicChord } from "../basics/basicChord";
import { calcRelativeNexus, findMatchingNexus } from "../basics/nexus";

type NexusPanelProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
};

export function formatKnownNexus(formerChord: BasicChord, latterChord: BasicChord): { relative: string; degree: string; key: string } {
	const relative = calcRelativeNexus(formerChord, latterChord).toString();
	const matches = findMatchingNexus(formerChord, latterChord);
	const primary = matches[0];
	if (primary) {
		return {
			relative,
			degree: primary.nexus.toString(),
			key: `in key=${primary.key.toString()}`
		};
	}

	return { relative, degree: "unknown", key: "-" };
}

export function NexusPanel(props: NexusPanelProps) {
	const { formerChord, latterChord } = props;
	const nexus = formatKnownNexus(formerChord, latterChord);

	return (
		<div className="nexus-panel">
			<div className="nexus-panel__relative">{nexus.relative}</div>
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
