import { ChordEntry } from "../../basics/progression";
import { Interval } from "../../basics/pitch";
import { ChordPanel } from "./chordPanel";
import { IconButton } from "../parts/iconButton";
import { ScalePanel } from "./scalePanel";

type ChordEntryPanelProps = {
	readonly entry: ChordEntry;
	readonly onChange: (nextExtraChordScaleTones: readonly Interval[] | undefined) => void;
	readonly onInsertBefore: () => void;
	readonly onInsertAfter: () => void;
	readonly onChangeChord: () => void;
	readonly onDelete: () => void;
};

export function ChordEntryPanel(props: ChordEntryPanelProps) {
	const { entry, onChange, onInsertBefore, onInsertAfter, onChangeChord, onDelete } = props;

	return (
		<div className="progression-editor__card chord-entry-panel">
			<div className="chord-entry-panel__controls">
				<IconButton icon="icons/insert-before.svg" label="Insert before" className="chord-entry-panel__insert-before-button" onClick={onInsertBefore} />
				<IconButton icon="icons/delete.svg" label="Delete" className="icon-button--delete" onClick={onDelete} />
				<IconButton icon="icons/insert-after.svg" label="Insert after" className="chord-entry-panel__insert-after-button" onClick={onInsertAfter} />
			</div>
			<ChordPanel value={entry.chord} onChangeChord={onChangeChord} />
			<ScalePanel chord={entry.chord} extraChordScaleTones={entry.extraChordScaleTones} onChange={onChange} />
		</div>
	);
}
