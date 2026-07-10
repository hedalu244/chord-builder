import { BasicChord } from "../basics/basicChord";
import { SearchedNexusBlock } from "./nexusBlock";

type NexusPanelProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
};

export function NexusPanel(props: NexusPanelProps) {
	const { formerChord, latterChord } = props;

	return (
		<div className="nexus-panel progression-editor__card">
			<SearchedNexusBlock formerChord={formerChord} latterChord={latterChord} showFormer={false} showLatter={false} />
		</div>
	);
}

export function DummyNexusPanel() {
	return (
		<div className="nexus-panel progression-editor__card nexus-panel--dummy">
		</div>
	);
}
