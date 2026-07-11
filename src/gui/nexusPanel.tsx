import { BasicChord } from "../basics/basicChord";
import { DegreeNexus } from "../basics/nexus";
import { IconButton } from "./iconButton";
import { SearchedNexusBlock } from "./nexusBlock";

type NexusPanelProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
	readonly pinnedNexus: DegreeNexus | undefined;
	readonly onEdit: () => void;
};

export function NexusPanel(props: NexusPanelProps) {
	const { formerChord, latterChord, pinnedNexus, onEdit } = props;

	return (
		<div className="nexus-panel progression-editor__card">
			<SearchedNexusBlock formerChord={formerChord} latterChord={latterChord} showFormer={false} showLatter={false} pinnedNexus={pinnedNexus} />
			{pinnedNexus === undefined && (
				<span className="nexus-panel__auto-label">auto calculated</span>
			)}
			<IconButton icon="icons/edit.svg" label="Edit nexus" className="nexus-panel__edit-button" onClick={onEdit} />
		</div>
	);
}

export function DummyNexusPanel() {
	return (
		<div className="nexus-panel progression-editor__card nexus-panel--dummy">
		</div>
	);
}
