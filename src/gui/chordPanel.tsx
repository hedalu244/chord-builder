import { FullChordInfo } from "../basics/fullChordInfo";
import { BasicChordPanel } from "./basicChordPanel";
import { QualityPanel } from "./qualityPanel";

function createActionButtonClassNames(extraClassName: string): string {
	return `chord-panel__action-button ${extraClassName}`;
}

type ChordPanelProps = {
	readonly value: FullChordInfo;
	readonly onQualityChange: (nextValue: FullChordInfo) => void;
	readonly onInsertBefore: () => void;
	readonly onInsertAfter: () => void;
	readonly onChangeChord: () => void;
	readonly onDelete: () => void;
};

export function ChordPanel(props: ChordPanelProps) {
	const { value, onQualityChange, onInsertBefore, onInsertAfter, onChangeChord, onDelete } = props;

	return (
		<div className="progression-editor__panel-box chord-panel">
			<div className="chord-panel__controls">
				<button type="button" className={createActionButtonClassNames("chord-panel__insert-before-button")} onClick={onInsertBefore}>
					Insert before
				</button>
				<button type="button" className={createActionButtonClassNames("chord-panel__delete-button")} onClick={onDelete}>
					Delete
				</button>
				<button type="button" className={createActionButtonClassNames("chord-panel__insert-after-button")} onClick={onInsertAfter}>
					Insert after
				</button>
			</div>
			<BasicChordPanel value={value.chord} onChangeChord={onChangeChord} />
			<QualityPanel value={value} onChange={onQualityChange} />
		</div>
	);
}
