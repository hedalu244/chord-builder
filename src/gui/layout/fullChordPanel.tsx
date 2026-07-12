import { FullChordInfo } from "../../basics/fullChordInfo";
import { ChordPanel } from "./chordPanel";
import { IconButton } from "../parts/iconButton";
import { QualityPanel } from "./qualityPanel";
import { ScalePanel } from "./scalePanel";

type FullChordPanelProps = {
	readonly value: FullChordInfo;
	readonly onChange: (nextValue: FullChordInfo) => void;
	readonly onInsertBefore: () => void;
	readonly onInsertAfter: () => void;
	readonly onChangeChord: () => void;
	readonly onDelete: () => void;
};

export function FullChordPanel(props: FullChordPanelProps) {
	const { value, onChange, onInsertBefore, onInsertAfter, onChangeChord, onDelete } = props;

	return (
		<div className="progression-editor__card full-chord-panel">
			<div className="full-chord-panel__controls">
				<IconButton icon="icons/insert-before.svg" label="Insert before" className="full-chord-panel__insert-before-button" onClick={onInsertBefore} />
				<IconButton icon="icons/delete.svg" label="Delete" className="icon-button--delete" onClick={onDelete} />
				<IconButton icon="icons/insert-after.svg" label="Insert after" className="full-chord-panel__insert-after-button" onClick={onInsertAfter} />
			</div>
			<ChordPanel value={value.chord} onChangeChord={onChangeChord} />
			<QualityPanel value={value} onChange={onChange} />
			<ScalePanel value={value} onChange={onChange} />
		</div>
	);
}
