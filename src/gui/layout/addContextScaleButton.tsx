type AddContextScaleButtonProps = {
	readonly onClick: () => void;
};

// 前後どちらかのコードが未選択で、まだ推定も手動選択もできないcontextScaleの代わりに表示するプレースホルダー。
// AddChordPanelと同じ見た目(枠のみ・全体が当たり判定)だが、shrinkに相当する操作は持たない。
export function AddContextScaleButton(props: AddContextScaleButtonProps) {
	const { onClick } = props;
	return (
		<button type="button" className="add-context-scale-button" onClick={onClick}>
			<img className="add-context-scale-button__icon" src="icons/add.svg" alt="" />
			<span className="add-context-scale-button__label">Add scale</span>
		</button>
	);
}
