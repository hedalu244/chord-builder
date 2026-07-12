import { IconButton } from "../parts/iconButton";

type AddChordPanelProps = {
	readonly onClick: () => void;
	// insertはカード(ChordEntryPanel)と同じ左右の位置に置く。常に押せるので条件なしで渡す
	readonly onInsertBefore: () => void;
	readonly onInsertAfter?: () => void;
	readonly onShift?: () => void;
};

// 追加系のコードとして、他のパネルとは意味合いが異なる。まだ何も追加されていないので、
// 実体のあるパネル群(白背景・実線)とは違い、枠のみ(破線・背景なし)で表示する。
export function AddChordPanel(props: AddChordPanelProps) {
	const { onClick, onInsertBefore, onInsertAfter, onShift } = props;
	return (
		<div className="progression-editor__placeholder add-chord-panel">
			<div className="progression-editor__card-controls">
				<IconButton icon="icons/insert-before.svg" label="Insert before" className="add-chord-panel__insert-before-button" onClick={onInsertBefore} />
				{onShift && (
					<IconButton icon="icons/shift.svg" label="Shift" className="add-chord-panel__shift-button" onClick={onShift} />
				)}
				{onInsertAfter && (
					<IconButton icon="icons/insert-after.svg" label="Insert after" className="add-chord-panel__insert-after-button" onClick={onInsertAfter} />
				)}
			</div>
			<button type="button" className="add-chord-panel__body" onClick={onClick}>
				<img className="add-chord-panel__icon" src="icons/add.svg" alt="" />
				<span className="add-chord-panel__label">Add chord</span>
			</button>
		</div>
	);
}
