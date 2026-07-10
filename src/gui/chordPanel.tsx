import { FullChordInfo } from "../basics/fullChordInfo";
import { BasicChordPanel } from "./basicChordPanel";
import { IconButton } from "./iconButton";
import { QualityPanel } from "./qualityPanel";
import { ScalePanel } from "./scalePanel";

type ChordPanelProps = {
	readonly value: FullChordInfo;
	readonly onChange: (nextValue: FullChordInfo) => void;
	readonly onInsertBefore: () => void;
	readonly onInsertAfter: () => void;
	readonly onChangeChord: () => void;
	readonly onDelete: () => void;
};

export function ChordPanel(props: ChordPanelProps) {
	const { value, onChange, onInsertBefore, onInsertAfter, onChangeChord, onDelete } = props;

	return (
		<div className="progression-editor__card chord-panel">
			<div className="chord-panel__controls">
				<IconButton icon="icons/insert-before.svg" label="Insert before" className="chord-panel__insert-before-button" onClick={onInsertBefore} />
				<IconButton icon="icons/delete.svg" label="Delete" className="chord-panel__delete-button" onClick={onDelete} />
				<IconButton icon="icons/insert-after.svg" label="Insert after" className="chord-panel__insert-after-button" onClick={onInsertAfter} />
			</div>
			<BasicChordPanel value={value.chord} onChangeChord={onChangeChord} />
			<QualityPanel value={value} onChange={onChange} />
			<ScalePanel value={value} onChange={onChange} />
		</div>
	);
}
