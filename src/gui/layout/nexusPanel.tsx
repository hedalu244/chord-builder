import { BasicChord } from "../../basics/basicChord";
import { DegreeNexus } from "../../basics/nexus";
import { IconButton } from "../parts/iconButton";
import { PreferredNexusBlock, SearchedNexusBlock } from "../parts/nexusBlock";

type NexusPanelProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
	readonly preferredNexus: DegreeNexus | undefined;
	readonly onEdit: () => void;
};

function nexusPanelClassName(isAuto: boolean): string {
	return isAuto ? "nexus-panel progression-editor__card nexus-panel--auto" : "nexus-panel progression-editor__card";
}

export function NexusPanel(props: NexusPanelProps) {
	const { formerChord, latterChord, preferredNexus, onEdit } = props;

	return (
		<div className={nexusPanelClassName(preferredNexus === undefined)}>
			{preferredNexus
				? <PreferredNexusBlock preferredNexus={preferredNexus} formerChord={formerChord} latterChord={latterChord} formerStyle="hidden" latterStyle="hidden" />
				: <SearchedNexusBlock formerChord={formerChord} latterChord={latterChord} formerStyle="hidden" latterStyle="hidden" />}
			{preferredNexus === undefined && (
				<span className="nexus-panel__auto-label">auto calculated</span>
			)}
			<IconButton icon="icons/edit.svg" label="Change nexus" className="nexus-panel__edit-button" onClick={onEdit} />
		</div>
	);
}

export function DummyNexusPanel() {
	return (
		<div className="nexus-panel progression-editor__card nexus-panel--dummy">
		</div>
	);
}
