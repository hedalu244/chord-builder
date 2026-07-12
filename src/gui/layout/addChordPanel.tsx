import { IconButton } from "../parts/iconButton";

type AddChordPanelProps = {
	readonly onClick: () => void;
	// 配列上の実体を持つプレースホルダーの場合のみ渡される。渡されなければ(末尾の追加専用スロットでは)shrinkボタンを出さない
	readonly onShrink?: () => void;
};

// 追加系のコードとして、他のパネルとは意味合いが異なる。まだ何も追加されていないので、
// 実体のあるパネル群(白背景・実線)とは違い、枠のみ(破線・背景なし)で表示する。
export function AddChordPanel(props: AddChordPanelProps) {
	const { onClick, onShrink } = props;
	return (
		<div className="add-chord-panel">
			{onShrink && (
				<div className="add-chord-panel__controls">
					<IconButton icon="icons/shrink.svg" label="Shrink" className="add-chord-panel__shrink-button" onClick={onShrink} />
				</div>
			)}
			<button type="button" className="add-chord-panel__body" onClick={onClick}>
				<img className="add-chord-panel__icon" src="icons/add.svg" alt="" />
				<span className="add-chord-panel__label">Add chord</span>
			</button>
		</div>
	);
}
