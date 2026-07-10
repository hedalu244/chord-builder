type AddChordPanelProps = {
	readonly onClick: () => void;
};

// 追加系のコードとして、他のパネルとは意味合いが異なる。まだ何も追加されていないので、
// 実体のあるパネル群(白背景・実線)とは違い、枠のみ(破線・背景なし)で表示する。
export function AddChordPanel(props: AddChordPanelProps) {
	const { onClick } = props;
	return (
		<button type="button" className="add-chord-panel" onClick={onClick}>
			<img className="add-chord-panel__icon" src="icons/add.svg" alt="" />
			<span className="add-chord-panel__label">Add chord</span>
		</button>
	);
}
