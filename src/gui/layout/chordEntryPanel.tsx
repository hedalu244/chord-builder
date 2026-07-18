import { ChordEntry } from "../../editor/chordEntry";
import { Interval } from "../../basics/pitch";
import { ChordPanel } from "./chordPanel";
import { IconButton } from "../parts/iconButton";
import { ChordScalePanel } from "./chordScalePanel";
import { noteName } from "../../basics/voicing";
import { playVoicing } from "../../player/chordPlayer";

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
			<div className="progression-editor__card-controls">
				<IconButton icon="icons/insert-before.svg" label="Insert before" onClick={onInsertBefore} />
				<IconButton icon="icons/delete.svg" label="Delete" className="icon-button--delete" onClick={onDelete} />
				<IconButton icon="icons/insert-after.svg" label="Insert after" onClick={onInsertAfter} />
			</div>
			<IconButton icon="icons/speaker.svg" label="Play" onClick={() => { void playVoicing(entry.voicing); }} />
			<ChordPanel value={entry.chord} onChangeChord={onChangeChord} />
			<ChordScalePanel entry={entry} onChange={onChange} />
			{/* デバッグ用のボイシング表示。編集UIができたら置き換える */}
			<div className="voicing-debug">{entry.voicing.map(noteName).join(" ")}</div>
		</div>
	);
}
